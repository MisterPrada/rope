import * as THREE from 'three'
import Experience from '../Experience.js'
import firefliesVertexShader from '../Shaders/FireFlies/vertex.glsl'
import firefliesFragmentShader from '../Shaders/FireFlies/fragment.glsl'

import firefliesVertexOriginalShader from '../Shaders/FireFlies/vertex_original.glsl'
import firefliesFragmentOriginalShader from '../Shaders/FireFlies/fragment_original.glsl'

export default class FireFlies {
    constructor() {
        this.experience = new Experience()
        this.debug = this.experience.debug
        this.scene = this.experience.scene
        this.time = this.experience.time
        this.camera = this.experience.camera.instance
        this.debug = this.experience.debug
        this.renderer = this.experience.renderer.instance
        this.timeline = this.experience.timeline
        this.resources = this.experience.resources
        this.sizes = this.experience.sizes

        this.particleSize = 0.016

        this.setModelCenter()
        this.setDebug()
    }

    setModelCenter() {
        /**
         * Fireflies
         */
            // Geometry
        const firefliesGeometry = new THREE.BufferGeometry()

        const firefliesCount = 40
        const positionArray = new Float32Array( firefliesCount * 3 )
        const scaleArray = new Float32Array( firefliesCount )

        for ( let i = 0; i < firefliesCount; i++ ) {
            positionArray[ i * 3 + 0 ] = ( Math.random() - 0.5 ) * 10
            positionArray[ i * 3 + 1 ] = Math.random() * 5
            positionArray[ i * 3 + 2 ] = ( Math.random() - 0.5 ) * 10

            scaleArray[ i ] = Math.random()
        }

        firefliesGeometry.setAttribute( 'position', new THREE.BufferAttribute( positionArray, 3 ) )
        firefliesGeometry.setAttribute( 'aScale', new THREE.BufferAttribute( scaleArray, 1 ) )

        // Material
        const firefliesMaterial = this.firefliesMaterial = new THREE.PointsMaterial( {
            size: 0.02,
            sizeAttenuation: true,
            //blending: THREE.AdditiveBlending,
            //transparent: true,
            //depthWrite: false,
            //depthTest: true,
            // alphaTest: 0.5,
        } )


        firefliesMaterial.onBeforeCompile = ( shader ) => {

            firefliesMaterial.uniforms = shader.uniforms;
            shader.uniforms.uPixelRatio = { value: Math.min( window.devicePixelRatio, 2 ) }
            shader.uniforms.uTime = { value: 0 }
            shader.uniforms.uResolution = new THREE.Uniform(
                new THREE.Vector2(
                    this.sizes.width * this.sizes.pixelRatio,
                    this.sizes.height * this.sizes.pixelRatio
                )
            )

            shader.vertexShader = firefliesVertexOriginalShader
            shader.fragmentShader = firefliesFragmentOriginalShader
        }

        firefliesMaterial.needsUpdate = true


        // this.firefliesMaterial = new THREE.ShaderMaterial({
        //     uniforms:
        //         {
        //             uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        //             uSize: { value: this.particleSize },
        //             uResolution: new THREE.Uniform(
        //                 new THREE.Vector2(
        //                     this.sizes.width * this.sizes.pixelRatio,
        //                     this.sizes.height * this.sizes.pixelRatio
        //                 )
        //             ),
        //             uTime: { value: 0 },
        //         },
        //     vertexShader: firefliesVertexShader,
        //     fragmentShader: firefliesFragmentShader,
        //     transparent: true,
        //     blending: THREE.AdditiveBlending,
        //     depthWrite: true,
        //     fog: false,
        //     depthTest: true,
        // })

        // Points
        const fireflies = new THREE.Points( firefliesGeometry, this.firefliesMaterial )

        //fireflies.renderOrder = 8
        fireflies.position.y = -10
        fireflies.position.z = -5
        // fireflies.position.x = 0
        this.scene.add( fireflies )


        // // create red cube
        // const geometry = new THREE.BoxGeometry(3, 3, 3);
        // const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        // const cube = new THREE.Mesh(geometry, material);
        // cube.position.set(0, -5, -3);
        // this.scene.add(cube);
    }


    resize() {
        if ( this.firefliesMaterial.uniforms ) {
            this.firefliesMaterial.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2)
            this.firefliesMaterial.uniforms.uResolution.value.set(this.sizes.width * this.sizes.pixelRatio, this.sizes.height * this.sizes.pixelRatio)
        }
    }

    update() {
        if ( this.firefliesMaterial.uniforms ){
            this.firefliesMaterial.uniforms.uTime.value = this.time.elapsed
        }
    }

    setDebug() {
        // Debug
        if ( this.debug.active ) {

        }
    }
}
