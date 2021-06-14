/**
 * Shader para el modelo de reflectancia de Cook-Torrance
 * David Genaro Lechuga Bernal
 * dlechuga@ciencias.unam.mx
 * https://github.com/dlechuga/cook-torrance
 */
// Vectex shader for Cook-Torrance ********************************************
const vertexShader = `#version 300 es

uniform mat4 u_worldViewProjection;
uniform vec3 u_lightWorldPos;
uniform mat4 u_world;
uniform mat4 u_camera;
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
	v_surfaceToView  = (u_camera[3] - (u_world * a_position)).xyz;
	// Vertex final
	gl_Position = v_position;
}
`;

// Fragment shader for Cook-Torrance ******************************************
const fragmentShader = `#version 300 es
#define PI 3.14159265
precision mediump float;

uniform vec4 u_lightColor;
uniform vec4 u_matColor;
uniform sampler2D u_texture;
uniform vec4 u_specular;
uniform float u_shininess;
uniform float u_specularFactor;

uniform vec4  u_ambientColor;
uniform float u_ambientIntensity;

uniform float u_diffConst;      // Lambertian reflectance value ρ
uniform float u_roughness;
uniform float u_IOR;
uniform float u_Kabsor;

in vec4 v_position;
in vec2 v_texCoord;
in vec3 v_normal;
in vec3 v_surfaceToLight;
in vec3 v_surfaceToView;

out vec4 out_FragColor;

// Distribución probabilística de las normales de las microfacetas (NDF)
// Usando la distribución de Beckmann
float D_Beckmann(float dotNH, float m) {
	if(dotNH > 0.0) {
		float dnh2 = dotNH * dotNH;
		float m2 = m * m;
		float xp = (dnh2 - 1.0) / (m2 * dnh2);

		return exp( xp ) / (PI * m2 * dnh2 * dnh2);
	}
	else {
		return 0.0;
	}
}

// Atenuación geométrica por las microfacetas
float G_Mask(float dotNH, float dotVH,
			 float dotNV, float dotNL) {
	if(dotVH > 0.0) {
		float nhv = 2.0 * dotNH / dotVH;
		return min( 1.0, min(dotNV * nhv, dotNL * nhv));
	}
	else
	{
		return 0.0;
	}
	
}

// Término de Fresnel usando la aproximación de Schlick
// considerando materiales conductores y dieléctricos
// Lazanyi, Szirmay-Kalos, “Fresnel term approximations for Metals”
float F_Schlick(float dotVH, float n, float k) {
	float xp = pow( 1.0 - dotVH, 5.0 );
	float top = (n-1.0)*(n-1.0) + 4.0*n*xp + k*k;
	float bot = (n+1.0)*(n+1.0) + k*k;
	return top / bot;
}

void main() {
	vec3 N = normalize(v_normal);
	vec3 L = normalize(v_surfaceToLight);
	vec3 V = normalize(v_surfaceToView);
	vec3 H = normalize(L + V);

	float dotNH = max( dot(N, H), 0.0);
	float dotNV = max( dot(N, V), 0.0);
	float dotNL = max( dot(N, L), 0.0);
	float dotVH = max( dot(V, H), 0.0);
	
	vec4 matColor = texture(u_texture, v_texCoord) * u_matColor;
	
	float D = D_Beckmann(dotNH, u_roughness);
	float F = F_Schlick(dotVH, u_IOR, u_Kabsor);
	float G = G_Mask(dotNH, dotVH, dotNV, dotNL);
	
	// float Rs = D * F * G / (4.0 * dotNL * dotNV);
	float Rs = D * F * G / (4.0 * dotNL * dotNV);
	
	vec4 specular = u_specular * Rs;

	// vec4 diffuse  = (1.0 - Rs);
	// vec4 diffuse  = s * kd;
	// Lambertian scattering
    float diffuse  = u_diffConst / PI;
	
	vec4 ambient   = matColor * u_ambientColor * u_ambientIntensity;

	/*
	R = s*Rs + d*Rd
	kd = (1-ks) * (1-metallic)
	1 / 256 = 0.00390625
	geometrically attenuated
	attenuated = 1 / (1+d^2)
	*/
	
	// Color final

	vec4 outColor = matColor * (u_lightColor * ((Rs + diffuse) * dotNL));
	outColor += ambient;
	out_FragColor = vec4(outColor.rgb, 1.0);
}
`;

export { vertexShader, fragmentShader };
