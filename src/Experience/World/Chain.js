import * as THREE from 'three'
import Model from './Abstracts/Model.js'
import Experience from '../Experience.js'
import Debug from '../Utils/Debug.js'
import State from "../State.js";
import Materials from "../Materials/Materials.js";

import * as Helpers from '@experience/Utils/Helpers.js';

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

    cursorDebug = false

    constructor() {
        super()

        this.setModel()
        this.setListeners()
        this.setDebug()
    }

    setModel() {
        const lightBulbModel = this.lightBulbModel = this.resources.items.lightBulbModel.scene
        lightBulbModel.scale.setScalar(30)

        // Rotate x Math.PI throw geometry
        this.lightBulbModel.traverse((child) => {
            if (child.isMesh) {
                child.geometry.rotateX(Math.PI)
                child.geometry.rotateY(Math.PI / 2)
                child.geometry.translate(child.position.x, 0.018, child.position.z)

                // if ( child.name == 'Cube004_1' ) {
                //     child.material = new THREE.MeshPhysicalMaterial()
                // }

                if ( child.name == 'Cube004' ) { // bulb glass
                    //child.visible = false
                    //this.material = child.material

                    this.material = child.material = new THREE.MeshPhysicalMaterial(
                        {
                            color: 0x00e1ff,
                            transmission: 0.99,
                            opacity: 0.0,
                            metalness: 0.05,
                            roughness: 0.1,
                            ior: 1.5,
                            thickness: 0.0,
                            clearcoat: 0.73,
                            reflectivity: 0.5,
                            dispersion: 2.16,
                            attenuationColor: 0xffffff,
                            attenuationDistance: 1,
                            specularIntensity: 0,
                            specularColor: 0xffffff,
                            envMapIntensity: 1,
                            transparent: false,
                            depthWrite: true,
                            depthTest: true,
                        }
                    );

                }
            }
        } )

        const chainModel = this.chainModel = this.resources.items.chainModel.scene
        const chainSource = this.chainSource = this.resources.items.chainModel
        chainModel.scale.setScalar(0.015)


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
            // const geometry = new THREE.CylinderGeometry(segmentRadius, segmentRadius, segmentHeight, 16);
            // const mesh = new THREE.Mesh(geometry, ropeMaterial);
            // mesh.position.y = -i * segmentHeight;
            //this.scene.add(mesh);

            const mesh = Helpers.cloneGltf( this.chainSource ).scene
            mesh.position.y = -i * segmentHeight;
            mesh.traverse((child) => {
                if (child.isMesh) {
                    if ( i % 2 === 0 ) {
                        //child.geometry.rotateX( Math.PI / 2 )
                        child.rotateY( Math.PI / 2 )
                    }
                }
            } )

            this.scene.add(mesh);


            if ( i === 0 ) { // first object need fixed for correct working other chains
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
        const objectGeometry = new THREE.BoxGeometry(1, 2, 1);
        const objectMesh = this.objectMesh = new THREE.Mesh(objectGeometry, new THREE.MeshBasicMaterial({ color: 0xff0000 }));
        objectMesh.position.y = -(segmentCount * segmentHeight + 0.5);
        //this.scene.add(objectMesh);
        lightBulbModel.position.y = -(segmentCount * segmentHeight + 0.5);
        this.scene.add(lightBulbModel);

        const objectRigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(0, -(segmentCount * segmentHeight + 0.5), 0)
            .setLinearDamping(0.4)
            .setAngularDamping(0.4)

        const objectRigidBody = this.objectRigidBody = world.createRigidBody(objectRigidBodyDesc);

        const objectColliderDesc = RAPIER.ColliderDesc
            .cuboid(0.5, 1, 0.5)
            .setMass(2)
            .setRestitution(0)
        world.createCollider(objectColliderDesc, objectRigidBody);

        const lastSegmentBody = ropeSegments[ropeSegments.length - 1].rigidBody;
        const objectJointData = RAPIER.JointData.spherical(
            { x: 0, y: -segmentHeight / 2, z: 0 },
            { x: 0, y: 1, z: 0 }
        );

        world.createImpulseJoint(objectJointData, lastSegmentBody, objectRigidBody, true);


        // Create fake impulse
        // const impulse = { x: 2, y: 0, z: 0 };
        // Apply impulse to the object
        // objectRigidBody.applyImpulse(impulse, true);


        // Create red sphere
        const sphereGeometry = new THREE.SphereGeometry(1.5, 32, 32);
        const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xfea0d0 });
        const sphereMesh = this.sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
        if( this.cursorDebug ) {
            this.scene.add( sphereMesh );
        }

        // Create physical body for Rapier
        const sphereRigidBodyDesc = RAPIER.RigidBodyDesc.fixed()
            .setTranslation(-10000, 0, 0)
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

        this.world.step();


    }

    setListeners() {
        window.addEventListener( 'touchstart', () => {
            this.sphereRigidBody.setEnabled( true );
        })

        window.addEventListener( 'touchend', () => {
            this.sphereRigidBody.setEnabled( false );
        })
    }

    resize() {

    }

    setDebug() {
        if ( !this.debug.active ) return

        //this.debug.createDebugTexture( this.resources.items.displacementTexture )

        this.debugFolder = this.debug.panel.addFolder("Bulb Glass Material");
        //this.debugFolder.close()

        this.debugFolder.addColor( this.material, 'color' )
        this.debugFolder.add( this.material, 'transparent' )
        this.debugFolder.add( this.material, 'roughness', 0, 1, 0.01 )
        this.debugFolder.add( this.material, 'metalness', 0, 1, 0.01 )
        this.debugFolder.add( this.material, 'thickness', 0, 2, 0.001 )
        this.debugFolder.add( this.material, 'transmission', 0, 1, 0.01 )
        this.debugFolder.add( this.material, 'opacity', 0, 1, 0.01 )
            .onChange( () => {
                this.material.needsUpdate = true;
            } );
        //this.debugFolder.add( this.material, 'anisotropy', 0, 1, 0.0001 )
        this.debugFolder.addColor( this.material, 'attenuationColor' )
        this.debugFolder.add( this.material, 'attenuationDistance', 0, 1, 0.01 )
        this.debugFolder.add( this.material, 'clearcoat', 0, 1, 0.01 )
        this.debugFolder.add( this.material.clearcoatNormalScale, 'x', 0, 1, 0.01 ).name( "clearcoatNormalScale x" )
        this.debugFolder.add( this.material.clearcoatNormalScale, 'y', 0, 1, 0.01 ).name( "clearcoatNormalScale y" )
        this.debugFolder.add( this.material, 'clearcoatRoughness', 0, 1, 0.01 )
        this.debugFolder.add( this.material, 'dispersion', 0, 10, 0.01 )
        this.debugFolder.add( this.material, 'ior', 1.0, 3, 0.01 )
        this.debugFolder.add( this.material, 'reflectivity', 0, 1, 0.01 )
        this.debugFolder.add( this.material, 'iridescence', 0, 1, 0.01 )
        this.debugFolder.add( this.material, 'iridescenceIOR', 1.0, 3, 0.01 )

        Object.keys(this.material.iridescenceThicknessRange).forEach((key) => {
            this.debugFolder.add( this.material.iridescenceThicknessRange, key );
        })

        this.debugFolder.add( this.material, 'sheen', 0, 1, 0.01 )
        this.debugFolder.add( this.material, 'sheenRoughness', 0, 1, 0.01 )
        this.debugFolder.addColor( this.material, 'sheenColor' )
        this.debugFolder.add( this.material, 'specularIntensity', 0, 1, 0.01 )
        this.debugFolder.addColor( this.material, 'specularColor' )
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

        this.lightBulbModel.position.set(objectTranslation.x, objectTranslation.y, objectTranslation.z);
        this.lightBulbModel.quaternion.set(objectRotation.x, objectRotation.y, objectRotation.z, objectRotation.w);
    }

}
