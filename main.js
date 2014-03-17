/*
 * Copyright 2014, Chris Dewbery
 *
 * This software is provided 'as-is', without any express or implied
 * warranty. In no event will the authors be held liable for any damages
 * arising from the use of this software.
 *
 * Permission is granted to anyone to use this software for any purpose,
 * including commercial applications, and to alter it and redistribute it
 * freely, subject to the following restrictions:
 *
 * 1. The origin of this software must not be misrepresented; you must not
 * claim that you wrote the original software. If you use this software
 * in a product, an acknowledgement in the product documentation would be
 * appreciated but is not required.
 *
 * 2. Altered source versions must be plainly marked as such, and must not
 * be misrepresented as being the original software.
 *
 * 3. This notice may not be removed or altered from any source
 * distribution.
 */
  
 "use strict";

 /* default fragment and vertex shaders, if we were clever we would import these
  * from a file, rather than just hard-coding them here */

/*  Texture Shader */
 var fragmentShaderSource =
    "precision mediump float;                                                 \
	uniform sampler2D sampler;                                                \
	varying vec2 vUV;                                                         \
                                                                              \
    void main(void) {                                                         \
        gl_FragColor = texture2D(sampler, vUV);                               \
    }";
	
 var vertexShaderSource =                                                    	
    "attribute vec3 position;                                                 \
    uniform mat4 uMVMatrix;                                                   \
    uniform mat4 uPMatrix;                                                    \
	attribute vec2 uv;                                                        \
	varying vec2 vUV;                                                         \
	                                                                          \
    void main(void) {                                                         \
        gl_Position = uPMatrix * uMVMatrix * vec4(position, 1.0);             \
		vUV = uv;                                                             \
    }";

var camera;
var shaderProgram;
var projectionMatrix;
var viewMatrix;
var terrain;
var gl;
 
/* compile the provided shaderCode and return a shader which we can then
 * include in the shader program */ 
function compileShader(gl, type, shaderCode) 
{
    var shader = gl.createShader(type);
    gl.shaderSource(shader, shaderCode);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }
	return shader;
}
 
/* compile a shader program from the provided shader source
 * @param vertexShaderCode vertex shader source code to compile
 * @param fragmentShaderCode fragment shader source code to compile
 * @returns shaderProgram object, or null if failed.
 */
function createShaderProgram(gl, vertexShaderCode, fragmentShaderCode)
{
 	var fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderCode);
	var vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderCode);
	var shader = gl.createProgram();
    var count;
	
	gl.attachShader(shader, vertexShader);
	gl.attachShader(shader, fragmentShader);
	gl.linkProgram(shader);

	if (!gl.getProgramParameter(shader, gl.LINK_STATUS)) {
		alert("Could not initialise shaders");
		gl.deleteProgram(shader);
		gl.deteleShader(vertexShader);
		gl.deleteShader(fragmentShader);
		return null;
	}

    shader.attribute = {};
    shader.uniform = {};
	
	/* loop through all attributes and store then in the shader object as shader.attribute.string */
	count = gl.getProgramParameter(shader, gl.ACTIVE_ATTRIBUTES);
	for(var i = 0; i < count; i++) {
		var attrib = gl.getActiveAttrib(shader, i);
		shader.attribute[attrib.name] = gl.getAttribLocation(shader, attrib.name);
	}
	
	/* loop through all uniforms and store then in the shader object as shader.uniform.string */
	count = gl.getProgramParameter(shader, gl.ACTIVE_UNIFORMS);
    for(var i = 0; i < count; i++) {
		var uniform = gl.getActiveUniform(shader, i);
		shader.uniform[uniform.name] = gl.getUniformLocation(shader, uniform.name);
	}
	
    return shader;
}

function initGL(canvas)
{
	var _gl;
	try {
		_gl = canvas.getContext("experimental-webgl") || canvas.getConext("webgl");     
	}
	catch(e) {}	

	if (!_gl) {
		alert("Could not initialise WebGL. Your browser may not support it");
		return null;
	}
		
	_gl.viewport(0,0, canvas.width, canvas.height);
	_gl.clearDepth(1.0);
	_gl.cullFace(_gl.FRONT);
	_gl.clearColor(0.0, 0.0, 0.0, 1.0);
	_gl.enable(_gl.DEPTH_TEST);
	 
	return _gl;
}

function loadImage(gl, fileURL)
{
	var image = new Image();
	image.src = fileURL;
	image.texture = null;

	image.onload = function(e) {
		var texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.bindTexture(gl.TEXTURE_2D, null);
		image.texture = texture;
	}
	return image; 
}

/* Given R,G,B data in an array convert this to a WebGL texture */
function createTextureFromArray(gl, data, width, height)
{
	var texture = gl.createTexture();

	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, width, height, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array(data));
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.bindTexture(gl.TEXTURE_2D, null);    

	return texture;
}
 
function drawFrame(gl) 
{
	viewMatrix = camera.view;

	gl.useProgram(shaderProgram);

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
					
	gl.uniformMatrix4fv(shaderProgram.uniform.uPMatrix, false, projectionMatrix);
	gl.uniformMatrix4fv(shaderProgram.uniform.uMVMatrix, false, viewMatrix);
	gl.uniform1i(shaderProgram.uniform.sampler, 0);

	terrain.render(gl);
}
 
function tick() 
{
	requestAnimFrame(tick);
	drawFrame(gl);
}
 
function main()
{
    var canvas = document.getElementById("viewport");
		
    gl = initGL(canvas); 	
	
	projectionMatrix = mat4.create();
	viewMatrix = mat4.create();
	mat4.perspective(45, canvas.width / canvas.height, 0.1, 100.0, projectionMatrix);
	
	shaderProgram = createShaderProgram(gl, vertexShaderSource, fragmentShaderSource);

	camera = Object.create(Camera).init(canvas);
	camera.position = [0.0, 0.0, 7.0];
	
	var heightMap = Object.create(DiamondSquare).init(129, 0);
	terrain = Object.create(Terrain).init(gl, heightMap.data, 129, 129);	  
	terrain.texture = createTextureFromArray(gl, heightMap.image, 128, 128);
	terrain.shaderProgram = shaderProgram;
		 
	requestAnimFrame(tick);
}

 /* once the page has finished loading, kick off the main() function */
 window.addEventListener("load", main);