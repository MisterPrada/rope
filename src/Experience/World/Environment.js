import * as THREE from 'three'
import Experience from '../Experience.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export default class Environment {
    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.resources = this.experience.resources
        this.debug = this.experience.debug
        this.renderer = this.experience.renderer.instance

        this.scene.colorSpace = THREE.SRGBColorSpace

        this.setAmbientLight()
        //5this.setDirectionalLight()
        //this.setEnvironmentMap()

        this.setDebug()
    }

    setAmbientLight() {
        this.ambientLight = new THREE.AmbientLight( '#00e1ff', 1.5 )
        this.scene.add( this.ambientLight )
    }

    setDirectionalLight() {
        this.directionalLight = new THREE.DirectionalLight( '#ffffff', 1 )
        this.directionalLight.position.set( 0, 5, 5 )
        this.scene.add( this.directionalLight )
    }


    setEnvironmentMap() {
        const environment = new RoomEnvironment( this.renderer );
        const pmremGenerator = new THREE.PMREMGenerator( this.renderer );
        // // //
        const env = pmremGenerator.fromScene( environment ).texture;
        this.scene.background = env;
        //this.scene.environment = env;
        //this.environment = env;
        // //this.scene.backgroundBlurriness = 0.5;
        // //environment.dispose();

        // //set background transparent
        // this.scene.background = null;

    }

    setDebug() {
        if ( this.debug.active ) {

        }
    }
}
