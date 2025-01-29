import * as THREE from 'three'
import Model from './Abstracts/Model.js'
import Experience from '../Experience.js'
import Debug from '../Utils/Debug.js'
import State from "../State.js";
import Materials from "../Materials/Materials.js";

import Input from "@experience/Utils/Input.js";
import RAPIER from '@dimforge/rapier3d';

export default class Chain extends Model {
    experience = Experience.getInstance()
    debug = Debug.getInstance()
    state = State.getInstance()
    materials = Materials.getInstance()
    input = Input.getInstance()
    scene = experience.scene
    time = experience.time
    camera = experience.camera.instance
    renderer = experience.renderer.instance
    resources = experience.resources
    container = new THREE.Group();

    constructor() {
        super()

        this.setModel()
        this.setDebug()
    }

    setModel() {
        const gravity = { x: 0, y: -9.8, z: 0 };
        const world = this.world = new RAPIER.World(gravity);

        // Create materials
        const ropeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });


        // Create chain for the rope
        const ropeSegments = this.ropeSegments = [];
        const segmentCount = 10;
        const segmentHeight = 0.5;
        const segmentRadius = 0.1;

        for (let i = 0; i < segmentCount; i++) {
            const geometry = new THREE.CylinderGeometry(segmentRadius, segmentRadius, segmentHeight, 16);
            const mesh = new THREE.Mesh(geometry, ropeMaterial);
            mesh.position.y = -i * segmentHeight;
            this.scene.add(mesh);

            if ( i === 0) { // first object need fixed for correct working other chains
                // Create physical body for Rapier
                const rigidBodyDesc = RAPIER.RigidBodyDesc.fixed()
                    .setTranslation(0, -i * segmentHeight, 0)
                    // .setLinearDamping(0.5)
                    // .setAngularDamping(1.0);
                const rigidBody = world.createRigidBody(rigidBodyDesc);

                const colliderDesc = RAPIER.ColliderDesc.capsule(segmentHeight / 5, segmentRadius);
                world.createCollider(colliderDesc, rigidBody);

                ropeSegments.push({ mesh, rigidBody });
            } else {
                // Create physical body for Rapier
                const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
                    .setTranslation(0, -i * segmentHeight, 0)
                    .setLinearDamping(3.4)
                    .setAngularDamping(3.4)
                const rigidBody = world.createRigidBody(rigidBodyDesc);

                const colliderDesc = RAPIER.ColliderDesc
                    .capsule(segmentHeight / 5, segmentRadius)
                    .setMass(2)
                world.createCollider(colliderDesc, rigidBody);

                ropeSegments.push({ mesh, rigidBody });
            }
        }

        // Create connections
        for (let i = 0; i < ropeSegments.length - 1; i++) {
            const rbA = ropeSegments[i].rigidBody;
            const rbB = ropeSegments[i + 1].rigidBody;

            // -segmentHeight, segmentHeight below are local coordinates
            const jointData = RAPIER.JointData.spherical(
                { x: 0, y: -segmentHeight / 2, z: 0 }, // Anchor on the first chain
                { x: 0, y: segmentHeight / 2, z: 0 }  // Anchor on the second chain
            );

            world.createImpulseJoint(jointData, rbA, rbB, true);
        }

        // Create object and attach it to the last segment
        const objectGeometry = new THREE.BoxGeometry(1, 1, 1);
        const objectMesh = this.objectMesh = new THREE.Mesh(objectGeometry, new THREE.MeshBasicMaterial({ color: 0xff0000 }));
        objectMesh.position.y = -(segmentCount * segmentHeight + 0.5);
        this.scene.add(objectMesh);

        const objectRigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(0, -(segmentCount * segmentHeight + 0.5), 0)
            .setLinearDamping(0.4)
            .setAngularDamping(0.4)

        const objectRigidBody = this.objectRigidBody = world.createRigidBody(objectRigidBodyDesc);

        const objectColliderDesc = RAPIER.ColliderDesc
            .cuboid(0.5, 0.5, 0.5)
            .setMass(2)
            .setRestitution(0)
        world.createCollider(objectColliderDesc, objectRigidBody);

        const lastSegmentBody = ropeSegments[ropeSegments.length - 1].rigidBody;
        const objectJointData = RAPIER.JointData.spherical(
            { x: 0, y: -segmentHeight / 2, z: 0 },
            { x: 0, y: 0.5, z: 0 }
        );

        world.createImpulseJoint(objectJointData, lastSegmentBody, objectRigidBody, true);


        // Create fake impulse
        // const impulse = { x: 2, y: 0, z: 0 };
        // Apply impulse to the object
        // objectRigidBody.applyImpulse(impulse, true);


        // Create red sphere
        const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
        const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xfea0d0 });
        const sphereMesh = this.sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
        //this.scene.add( sphereMesh );

        // Create physical body for Rapier
        const sphereRigidBodyDesc = RAPIER.RigidBodyDesc.fixed()
            .setTranslation(0, 0, 0)
            .setLinearDamping(0.0)
            .setAngularDamping(0.0)
            .setAdditionalMass(5)
        const sphereRigidBody = this.sphereRigidBody = world.createRigidBody(sphereRigidBodyDesc);

        const sphereColliderDesc = RAPIER.ColliderDesc
            .ball(1.5)
            .setMass(20)
            .setRestitution(1)
        world.createCollider(sphereColliderDesc, sphereRigidBody);


        // Self render for world, because in Updater it is called too often, which leads to
        // slow work on low-performance
        setInterval(() => {
            // Шаг симуляции Rapier
            this.world.step();
        }, 1 / 60);
    }

    resize() {

    }

    setDebug() {
        if ( !this.debug.active ) return

        //this.debug.createDebugTexture( this.resources.items.displacementTexture )
    }

    update( deltaTime ) {

        this.sphereMesh.position.copy( this.input.cursor3D )
        this.sphereRigidBody.setTranslation({ x: this.input.cursor3D.x, y: this.input.cursor3D.y, z: this.input.cursor3D.z }, true);

        // Sync Three.js objects with Rapier physical bodies
        this.ropeSegments.forEach(({ mesh, rigidBody }) => {
            const translation = rigidBody.translation();
            const rotation = rigidBody.rotation();

            mesh.position.set(translation.x, translation.y, translation.z);
            mesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
        });

        const objectTranslation = this.objectRigidBody.translation();
        const objectRotation = this.objectRigidBody.rotation();
        this.objectMesh.position.set(objectTranslation.x, objectTranslation.y, objectTranslation.z);
        this.objectMesh.quaternion.set(objectRotation.x, objectRotation.y, objectRotation.z, objectRotation.w);
    }

}
