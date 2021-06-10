/**
 * Shader para el modelo de Blinn–Phong
 * David Genaro Lechuga Bernal
 * dlechuga@ciencias.unam.mx
 * https://github.com/dlechuga
 */
// Vertex shader para Blinn–Phong *********************************************
const vertexShader = `#version 300 es

uniform mat4 u_worldViewProjection;
uniform vec3 u_lightWorldPos;
uniform mat4 u_world;
uniform mat4 u_viewInverse;
uniform mat4 u_worldInverseTranspose;

in vec4 a_position;
in vec3 a_normal;
in vec2 a_texcoord;

out vec4 v_position;
out vec2 v_texCoord;
out vec3 v_normal;
out vec3 v_surfaceToLight;
out vec3 v_surfaceToView;

void main() {
	v_position = (u_worldViewProjection * a_position);
	v_texCoord = a_texcoord;
	v_normal   = (u_worldInverseTranspose * vec4(a_normal, 0)).xyz;
	v_surfaceToLight = u_lightWorldPos - (u_world * a_position).xyz;
	v_surfaceToView  = (u_viewInverse[3] - (u_world * a_position)).xyz;
	// Vertex final
	gl_Position = v_position;
}
`;

// Fragment shader para Blinn–Phong *******************************************
const fragmentShader = `#version 300 es
precision mediump float;

in vec4 v_position;
in vec2 v_texCoord;
in vec3 v_normal;
in vec3 v_surfaceToLight;
in vec3 v_surfaceToView;

uniform vec4 u_lightColor;
uniform vec4 u_matColor;
uniform sampler2D u_texture;
uniform vec4 u_specular;
uniform float u_shininess;
uniform float u_specularFactor;

uniform vec4 u_ambientColor;
uniform float u_ambientIntensity;

out vec4 out_FragColor;

void main() {
	vec3 N = normalize(v_normal);
	vec3 L = normalize(v_surfaceToLight);
	vec3 V = normalize(v_surfaceToView);
	vec3 H = normalize(L + V);

	float dotNH = max( dot(N, H), 0.0);
	float dotNL = max( dot(N, L), 0.0);

	vec4 matColor = texture(u_texture, v_texCoord) * u_matColor;

	float spec = (dotNL > 0.0) ? pow( dotNH , u_shininess) : 0.0;

	vec4 ambient  = u_ambientColor * u_ambientIntensity;
	vec4 diffuse  = u_lightColor * dotNL;
	vec4 specular = u_specular * (u_specularFactor * spec);

	// Color final
	vec4 outColor = (ambient + diffuse + specular) * matColor;
	out_FragColor = vec4(outColor.rgb, 1.0);
}
`;

export { vertexShader, fragmentShader };
