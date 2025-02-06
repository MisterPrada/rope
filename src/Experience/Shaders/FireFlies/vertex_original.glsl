uniform float size;
uniform float scale;

// custom params
uniform float uPixelRatio;
uniform float uSize;
uniform float uTime;
uniform vec2 uResolution;
attribute float aScale;

#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
varying vec2 vUv;
uniform mat3 uvTransform;
#endif
void main() {
    #ifdef USE_POINTS_UV
    vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
    #endif
    #include <color_vertex>
    #include <morphinstance_vertex>
    #include <morphcolor_vertex>
    #include <begin_vertex>
    #include <morphtarget_vertex>


    transformed.y += sin(uTime + position.x * 100.0) * aScale * 0.07;
    transformed.x += sin(uTime + position.y * 100.0) * aScale * 0.001;
    transformed.z += sin(uTime + position.x * 100.0) * aScale * 0.03;

    #include <project_vertex>




    gl_PointSize = size * clamp(uSize, 40.0, 250.) * aScale;
    #ifdef USE_SIZEATTENUATION
    bool isPerspective = isPerspectiveMatrix( projectionMatrix );
    if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
    #endif
    #include <logdepthbuf_vertex>
    #include <clipping_planes_vertex>
    #include <worldpos_vertex>
    #include <fog_vertex>


//    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
//    modelPosition.y += sin(uTime + modelPosition.x * 100.0) * aScale * 0.07;
//    modelPosition.x += sin(uTime + modelPosition.y * 100.0) * aScale * 0.001;
//    modelPosition.z += sin(uTime + modelPosition.x * 100.0) * aScale * 0.03;
//
//    vec4 viewPosition = viewMatrix * modelPosition;
//    vec4 projectionPosition = projectionMatrix * viewPosition;
//
//    gl_Position = projectionPosition;
//    gl_PointSize = clamp(uSize, 40.0, 250.) * uSize * aScale * uResolution.y;
//    gl_PointSize *= (1.0 / - viewPosition.z);
}
