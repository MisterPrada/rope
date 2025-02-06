import Experience from '../Experience.js'
import Environment from './Environment.js'
import ExampleClass from "./ExampleClass.js";
import DebugHelpers from "./DebugHelpers.js";
import Ui from "../Ui/Ui.js";
import State from "../State.js";
import Time from "../Utils/Time.js";
import EventEmitter from '@experience/Utils/EventEmitter.js';

import Chain from "./Chain.js"
import FireFlies from "./FireFlies.js"

export default class World extends EventEmitter{
    constructor() {
        super();

        this.experience = Experience.getInstance()
        this.ui = new Ui()
        this.time = Time.getInstance()

        this.camera = this.experience.camera;
        this.scene = this.experience.scene

        this.resources = this.experience.resources
        this.html = this.experience.html
        this.sound = this.experience.sound
        this.debug = this.experience.debug.panel

        // Wait for resources
        this.resources.on( 'ready', () => {
            this.state = new State()

            //this.startWithPreloader()
            this.start()
        } )
    }

    start() {
        // setTimeout( () => {
        //     window.preloader.hidePreloader()
        //     // window.preloader.showPlayButton(() => {
        //     //     // start media playing
        //     // })
        // }, 1000)

        window.preloader.hidePreloader()

        this.time.reset()

        this.setupWorld()

        this.animationPipeline();

        this.trigger( 'ready' )
        window.dispatchEvent( new CustomEvent( "3d-app:ready" ) );
    }

    setupWorld() {
        // Setup
        //this.cube = new ExampleClass()
        this.chain = new Chain()
        this.fireFlies = new FireFlies()
        this.environment = new Environment()

        // Add debug helpers
        this.debugHelpers = new DebugHelpers()

        // Animation timeline
        this.animationPipeline();

        // Dispatch event
        this.experience.appLoaded = true
    }

    startWithPreloader() {
        this.ui.playButton.classList.add( "fade-in" );
        this.ui.playButton.addEventListener( 'click', () => {

            this.ui.playButton.classList.replace( "fade-in", "fade-out" );
            //this.sound.createSounds();

            setTimeout( () => {
                this.time.reset()

                // Setup
                this.setupWorld()

                // Remove preloader
                this.ui.preloader.classList.add( "preloaded" );
                setTimeout( () => {
                    this.ui.preloader.remove();
                    this.ui.playButton.remove();
                }, 2500 );
            }, 100 );
        }, { once: true } );
    }

    animationPipeline() {
        // if ( this.text )
        //     this.text.animateTextShow()

        if ( this.camera )
            this.camera.animateCameraPosition()
    }

    postInit() {

    }

    resize() {
        this.state?.resize()
        this.chain?.resize()
        this.fireFlies?.resize()
    }

    update( deltaTime ) {
        this.debugHelpers?.update( deltaTime )
        this.cube?.update( deltaTime )
        this.chain?.update( deltaTime )
        this.fireFlies?.update( deltaTime )
    }

    postUpdate( deltaTime ) {

    }
}
