/**
 * Shader para el modelo de Blinn–Phong
 * David Genaro Lechuga Bernal
 * dlechuga@ciencias.unam.mx
 * https://github.com/dlechuga/cook-torrance
 */
// Vertex shader para Blinn–Phong *********************************************
const vertexShader = `#version 300 es

// Transforms
uniform mat4 u_world;
uniform mat4 u_camera;
uniform mat4 u_worldViewProjection;
uniform mat4 u_worldInverseTranspose;
// Luces
uniform vec3 u_pointLightWorldPosition;

// Geometry attributes
in vec4 a_position;
in vec3 a_normal;
in vec2 a_texcoord;

out vec4 v_position;
out vec3 v_normal;
out vec2 v_texCoord;
out vec3 v_worldPosition;
out vec3 v_surfaceToLight;
out vec3 v_surfaceToView;

void main() {
    vec4 worldPosition = u_world * a_position;
    
	v_position = (u_worldViewProjection * a_position);
	v_normal   = (u_worldInverseTranspose * vec4(a_normal, 0)).xyz;
	v_texCoord = a_texcoord;
    v_worldPosition  = worldPosition.xyz;
    v_surfaceToLight = u_pointLightWorldPosition - v_worldPosition;
	v_surfaceToView  = (u_camera[3] - worldPosition).xyz;
	
    // Vertex final
	gl_Position = v_position;
}
`;

// Fragment shader para Blinn–Phong *******************************************
const fragmentShader = `#version 300 es
#define PI 3.14159265
// precision mediump float;
precision highp float;

// Material
uniform vec4 u_matColor;
uniform sampler2D u_texture;
uniform float u_diffConst;

uniform vec4 u_specular;
uniform float u_shininess;
uniform float u_specConst;

// Luces
uniform vec4 u_ambientColor;
uniform float u_ambientIntensity;
uniform vec3 u_dirLightWorldPosition;
uniform vec4 u_dirLightColor;
uniform vec3 u_pointLightWorldPosition;
uniform vec4 u_pointLightColor;
uniform float u_pointLightRadius;

in vec4 v_position;
in vec3 v_normal;
in vec2 v_texCoord;
in vec3 v_worldPosition;
in vec3 v_surfaceToLight;
in vec3 v_surfaceToView;

out vec4 out_FragColor;

void main() {
	vec3 LD = normalize(u_dirLightWorldPosition);
	vec3 LP = normalize(v_surfaceToLight);
	vec3 V  = normalize(v_surfaceToView);
	vec3 N  = normalize(v_normal);
	vec3 HD  = normalize(LD + V);
	vec3 HP  = normalize(LP + V);

	float dotNLD = max( dot(N, LD), 0.0);
	float dotNLP = max( dot(N, LP), 0.0);
	float dotNHD = max( dot(N, HD), 0.0);
	float dotNHP = max( dot(N, HP), 0.0);

	vec4 matColor = texture(u_texture, v_texCoord) * u_matColor;

    float dist = distance(u_pointLightWorldPosition, v_worldPosition);
    float dr   = 1.0 + (dist / u_pointLightRadius);
    dr *= dr;
    // https://imdoingitwrong.wordpress.com/2011/01/31/light-attenuation/
    float attenuation = 1.0 / dr;
    // float attenuation = 1.0 / (dist * dist);
    // float attenuation = 1.0 / (a + b*dist + c*dist*dist);

    // Ambient
	vec4 ambient  = u_ambientColor * u_ambientIntensity;
	// Diffuse
	vec4 diffuseDir   = dotNLD * u_dirLightColor;
    vec4 diffusePoint = dotNLP * u_pointLightColor * attenuation;
    vec4 diffuse = u_diffConst * (diffuseDir + diffusePoint);
	//Specular
    // Foley Van Dam pag 361, 721
	// float spec = u_specConst * (8.0 + u_shininess) / (8 * PI) * pow(dotNH, u_shininess);
    // float spec = (dotNL > 0.0) ? pow( dotNH , u_shininess) : 0.0;
    
    vec4 specularDir   = u_dirLightColor * (pow(dotNHD, u_shininess) * (8.0 + u_shininess) / (8.0 * PI));
    vec4 specularPoint = u_dirLightColor * attenuation * (pow(dotNHP, u_shininess) * (8.0 + u_shininess) / (8.0 * PI));
    vec4 specular = u_specConst * (specularDir + specularPoint);
    

	// Color final
	// vec4 outColor = (ambient + diffuse + specular + emissive) * matColor;
	vec4 outColor = (ambient + diffuse + specular) * matColor;
	out_FragColor = vec4(outColor.rgb, 1.0);
}
`;

export { vertexShader, fragmentShader };
