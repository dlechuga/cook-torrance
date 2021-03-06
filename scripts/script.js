/**
 * Modelo de reflectancia de Cook-Torrance y Blinn–Phong
 * David Genaro Lechuga Bernal
 * dlechuga@ciencias.unam.mx
 * https://github.com/dlechuga/cook-torrance
 */
// Biblioteca auxiliar para simplificar las llamadas a WebGL
import * as twgl from './twgl-full.module.js';
twgl.setDefaults({attribPrefix: "a_"});
// Modulo para operaciones con matrices
const m4 = twgl.m4;
// Shaders
import * as bp from './blinn-phong-shaders.js';
import * as ct from './cook-torrance-shaders.js';
// Creación de contexto para WebGL 2.0
const gl = document.querySelector("#c").getContext("webgl2");
// Compila shaders
const programInfoBP = twgl.createProgramInfo(gl, [bp.vertexShader, bp.fragmentShader]);	// Blinn–Phong
const programInfoCT = twgl.createProgramInfo(gl, [ct.vertexShader, ct.fragmentShader]);	// Cook-Torrance

/**
 * Genera un número aleatorio en un rango dado
 */
function rand(min, max) {
	return min + Math.random() * (max - min);
}

// Configuración de la perspectiva
const fov   = 45 * Math.PI / 180;
const zNear = 0.5
const zFar  = 100
// Configuración de la cámara
const eye    = [0, 10, 10];
const target = [0, 0, 0];
const up     = [0, 1, 0];
// Matrices compartidas para la cámara en la escena
const camera = m4.identity();
const view = m4.identity();
const viewProjection = m4.identity();
// Configuración de las fuentes de luz
const pointLightWorldPosition = [20, 20, 0];	// Point light
const pointLightColor = [1, 0, 0, 1];			// Point light color
const pointLightRadius = 20;					// Point light radius
const dirLightWorldPosition = [-20, 20, 0];		// Directional light
const dirLightColor = [0.5, 1, 0.5, 1];			// Directional light color
const ambientColor = [0.5, 0.5, 1, 1];			// Ambient light color
const ambientIntensity = 0.10;					// Ambient light
// Color base de las figuras
const baseHue = rand(0, 360);
// Textura de 2x2 pixeles
const tex = twgl.createTexture(gl, {
  min: gl.NEAREST,
  mag: gl.NEAREST,
  src: [
	255, 255, 255, 255,
	168, 168, 168, 255,
	168, 168, 168, 255,
	255, 255, 255, 255,
  ],
});

// Geometria de las figuras
const shapes = [
	// Plano fijo
	twgl.primitives.createPlaneBufferInfo(gl, 25, 25),
	// Figuras geométricas
	twgl.primitives.createCylinderBufferInfo(gl, 1, 2, 24, 2), 
	twgl.primitives.createCresentBufferInfo(gl, 1.5, 1.0, 0.15, 0.25, 24), 
	twgl.primitives.createTruncatedConeBufferInfo(gl, 1.5, .5, 1.5, 32, 1), 
	twgl.primitives.createTorusBufferInfo(gl, 1, 0.5, 32, 24), 
	twgl.primitives.createSphereBufferInfo(gl, 1.5, 24, 24), 
	twgl.primitives.createCubeBufferInfo(gl, 2), 
	//twgl.primitives.createDiscBufferInfo(gl, 1, 24), 
];
// Arreglos para lista de figuras
const drawObjects = [];
// Configuración genérica de todas las figuras
for (let ii = 0; ii < shapes.length; ++ii) {
	const uniforms = {
		// Color
		u_matColor: chroma.hsv(0, 0, 0.8).gl(),
		u_texture: tex,
		// Blinn–Phong
		u_diffConst: 0.79,		// Lambertian reflectance value ρ <= 1.0
		u_specConst: 0.19,		// u_diffConst + u_diffConst <= 1.0
		u_shininess: 150,
		// Cook-Torrance
		u_roughness : 0.1,	
		u_IOR : 2.5,		// n >= 1.0 , vacum = 1.0
		u_Kabsor : 1.0,
		// Luces
		u_pointLightWorldPosition: pointLightWorldPosition,
		u_pointLightColor: pointLightColor,
        u_pointLightRadius: pointLightRadius,
        u_dirLightWorldPosition: dirLightWorldPosition,
        u_dirLightColor: dirLightColor,
		u_ambientColor : ambientColor,
		u_ambientIntensity : ambientIntensity,
		// Transformaciones
		u_world: m4.identity(),
		u_camera: camera,
		u_worldViewProjection: m4.identity(),
		u_worldInverseTranspose: m4.identity(),
	};
	drawObjects.push({
		programInfo: programInfoBP,
		// programInfo: programInfoCT,
		bufferInfo: shapes[ii],
		uniforms: uniforms,
		translation: [0, 0, 0],
		xSpeed: 0,
		ySpeed: 0,
		zSpeed: 0,
	});
}
// Configuración específica al plano fijo
drawObjects[0].translation = [0, -5, 0];
// Configuración para dibujar en orden
const rows = 2;
const cols = 3;
// Configuración específica de las figuras geométricas
for (let ii = 0; ii < rows; ++ii) {
	for (let jj = 0; jj < cols; ++jj) {
		const obj = drawObjects[1 + jj + (ii * cols)];
		// obj.uniforms.u_matColor = chroma.hsv((baseHue + rand(0, 90)) % 360, 0.75, 1).gl();
		obj.xSpeed = rand(-0.4, 0.4);
		obj.ySpeed = rand(-0.4, 0.4);
		obj.zSpeed = rand(-0.4, 0.4);
		obj.translation = [-5 + (jj * 5), 0, -3 + (ii * 5)];
	}
}

// Render
function render(time) {
	// Tiempo en segundos
	time *= 0.001;
	// Reajusta el canvas a la ventana
	twgl.resizeCanvasToDisplaySize(gl.canvas);
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	// Limpia el canvas
	gl.enable(gl.DEPTH_TEST);
	gl.clearColor(0.0, 0.0, 0.0, 1);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	// Matriz de proyección en perspectiva
	const projection = m4.perspective(fov, gl.canvas.clientWidth / gl.canvas.clientHeight, zNear, zFar);
	// Matriz para la cámara
	m4.lookAt(eye, target, up, camera);
	m4.inverse(camera, view);
	m4.multiply(projection, view, viewProjection);
	// Aplica transformaciones a los objetos
	drawObjects.forEach(function(obj) {
		const uni = obj.uniforms;
		const world = uni.u_world;
		m4.identity(world);
		m4.translate(world, obj.translation, world);
		m4.rotateX(world, time * obj.xSpeed, world);
		m4.rotateY(world, time * obj.ySpeed, world);
		m4.rotateZ(world, time * obj.zSpeed, world);
		// Matriz para normales
		m4.transpose(m4.inverse(world, uni.u_worldInverseTranspose), uni.u_worldInverseTranspose);
		// Matriz final de transformación a clip space
		m4.multiply(viewProjection, uni.u_world, uni.u_worldViewProjection);
	});
// Llamadas a WebGL para ejecutar el render
twgl.drawObjectList(gl, drawObjects);
// Llamada recursiva para que el navegador dibuje constantemente
requestAnimationFrame(render);
}
requestAnimationFrame(render);
