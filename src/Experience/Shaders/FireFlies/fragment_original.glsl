uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
    vec4 diffuseColor = vec4( diffuse, opacity );
    #include <clipping_planes_fragment>
    vec3 outgoingLight = vec3( 0.0 );
    #include <logdepthbuf_fragment>
    #include <map_particle_fragment>
    #include <color_fragment>
    #include <alphatest_fragment>
    #include <alphahash_fragment>

    float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
    float strength = 0.05 / distanceToCenter - 0.1;
    diffuseColor.rgb = vec3( 1.0, 0.5, 0.0 ) * strength;

    outgoingLight = diffuseColor.rgb;
    #include <opaque_fragment>
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
    #include <premultiplied_alpha_fragment>

    if ( strength < 0.0 ) discard;
    gl_FragColor.a = strength;
}
