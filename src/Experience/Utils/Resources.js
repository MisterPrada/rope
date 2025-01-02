import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import EventEmitter from './EventEmitter.js'

import Obfuscate from '@experience/Utils/Helpers/Obfuscate.js';

export default class Resources extends EventEmitter
{
    constructor(sources)
    {
        super()

        this.sources = sources
        // this.sourcesFilter()
        // this.obfuscate = Obfuscate.getInstance()


        this.items = {}
        this.toLoad = this.sources.length
        this.loaded = 0
        this.loadedAll = false

        this.setLoaders()
        this.startLoading()
    }

    sourcesFilter(){
        if ( import.meta.env.MODE === "development" ) {
            return true
        }

        this.sources.forEach( source => {
            if ( source.type.match( 'Model' ) ) {
                // replace .glb, .gltf, .obj with .bin
                source.path = source.path.replace( /\.(glb|gltf|obj|json)/, '.bin' )
                source.type = 'binModel'
            }
        })
    }

    setLoaders()
    {
        this.loaders = {}
        this.loaders.gltfLoader = new GLTFLoader()
        this.loaders.objLoader = new OBJLoader()
        this.loaders.textureLoader = new THREE.TextureLoader()
        this.loaders.cubeTextureLoader = new THREE.CubeTextureLoader()
        this.loaders.RGBELoader = new RGBELoader()
        this.loaders.fontLoader = new FontLoader()
        this.loaders.AudioLoader = new THREE.AudioLoader()

        // add DRACOLoader
        const dracoLoader = new DRACOLoader()
        dracoLoader.setDecoderPath( '/draco/' )

        const ktx2Loader = new KTX2Loader();
        ktx2Loader.setTranscoderPath( '/basis/' );

        this.loaders.gltfLoader.setDRACOLoader( dracoLoader )
        this.loaders.gltfLoader.setKTX2Loader( ktx2Loader );
        this.loaders.gltfLoader.setMeshoptDecoder( MeshoptDecoder );
    }

    startLoading()
    {
        // Load each source
        for(const source of this.sources)
        {
            if(source.type === 'binModel')
            {
                this.obfuscate.loadFile( source.path, ( arrayBuffer ) => {
                    this.obfuscate.decode( arrayBuffer, source.path, ( model ) => {
                        this.sourceLoaded( source, model )
                    })
                } )
            }
            else if(source.type === 'gltfModel')
            {
                this.loaders.gltfLoader.load(
                    source.path,
                    (file) =>
                    {
                        this.sourceLoaded(source, file)
                    }
                )
            }
            else if(source.type === 'objModel')
            {
                this.loaders.objLoader.load(
                    source.path,
                    (file) =>
                    {
                        this.sourceLoaded(source, file)
                    }
                )
            }
            else if(source.type === 'texture')
            {
                this.loaders.textureLoader.load(
                    source.path,
                    (file) =>
                    {
                        // Default settings
                        file.colorSpace = THREE.SRGBColorSpace;

                        this.sourceLoaded(source, file)
                    }
                )
            }
            else if ( source.type === 'videoTexture' ) {
                let videoElement = document.createElement( 'video' )
                videoElement.src = source.path
                videoElement.setAttribute( 'crossorigin', 'anonymous' )
                videoElement.muted = true
                videoElement.loop = true
                videoElement.load()
                videoElement.setAttribute( 'playsinline', '' )
                videoElement.setAttribute( 'webkit-playsinline', '' )
                videoElement.play()

                const obj = {
                    videoTexture : new THREE.VideoTexture( videoElement ),
                    videoElement : videoElement
                }

                videoElement.addEventListener( 'canplaythrough', () => {
                    this.sourceLoaded( source, obj )
                } )
            }
            else if(source.type === 'cubeTexture')
            {
                this.loaders.cubeTextureLoader.load(
                    source.path,
                    (file) =>
                    {
                        this.sourceLoaded(source, file)
                    }
                )
            }
            else if(source.type === 'rgbeTexture')
            {
                this.loaders.RGBELoader.load(
                    source.path,
                    (file) =>
                    {
                        this.sourceLoaded(source, file)
                    }
                )
            }
            else if(source.type === 'font')
            {
                this.loaders.fontLoader.load(
                    source.path,
                    (file) =>
                    {
                        this.sourceLoaded(source, file)
                    }
                )
            }
            else if(source.type === 'audio')
            {
                this.loaders.AudioLoader.load(
                    source.path,
                    (file) =>
                    {
                        this.sourceLoaded(source, file)
                    }
                )
            }
            else if(source.type === 'json')
            {
                fetch( source.path ).then(
                    response => {
                        response.json().then(
                            data => {
                                this.sourceLoaded(source, data)
                                return data
                            }
                        )
                    }
                )
            }
        }

        if(this.sources.length === 0) {
            setTimeout(() => {
                this.loadedAll = true
                this.trigger('ready')
            });
        }
    }

    sourceLoaded(source, file)
    {
        this.items[source.name] = file

        this.loaded++

        if(this.loaded === this.toLoad)
        {
            this.loadedAll = true
            this.trigger('ready')
        }
    }
}
