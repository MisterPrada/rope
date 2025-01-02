import fs from 'fs'

// Delete recursive all files /dist/models/ with pattern (all .glb, .gltf, .obj, .json)
const path = './dist/models/'
fs.readdir(path, { recursive: true }, (err, files) => {
    if (err) {
        console.error(err)
        return
    }

    files.forEach(file => {
        if (file.endsWith('.glb') || file.endsWith('.gltf') || file.endsWith('.obj') || file.endsWith('.json')) {
            fs.unlink(path + file, (err) => {
                if (err) {
                    console.error(err)
                    return
                }
                console.log('File deleted:', file)
            })
        }
    })
})

