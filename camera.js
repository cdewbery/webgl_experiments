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

/**
 * A basic Camera class
 */
var Camera = Object.create(Object, {

    /* vector to store the rotational angles x,y,z */
	/* rotation around x (pitch), rotation around y (yaw), rotation around z (roll) */
    _angles: {
		writable : true,
	    value: null
	},
	
    angles: {
	    get: function() {
		    return this._angles;
		},
		set: function(value) {
		    this._angles = value;
			this._changed = true;
		}
	},
	
	/* vector to store the position, x,y,z */
	_position: {
		writable : true,
	    value: null
	},
	
	position: { 
	    get: function() {
		    return this._position;
		},
		set: function(value) {
		    this._position = value;
			this._changed = true;
		}
	},
	
	_changed: {
	    writable : true,
	    value: true
	},
	
	_pressed: {
	    writable: true,
		value : null,
	},
	
	_view: {
	    writable : true,
	    value: null
	},
	
	view: {
	    get: function() {
		    if (this._changed) {
			    var mv = this._view;
				mat4.identity(mv);
				mat4.rotateX(mv, this.angles[0] - Math.PI / 2.0);
				mat4.rotateZ(mv, this.angles[2]);
				mat4.rotateY(mv, this.angles[1]);
				/* simulate camera position at x,y,z by moving to -x,-y,-z */
				mat4.translate(mv, [-this.position[0], -this.position[1], -this.position[2]]);
				this._view = mv;
				this._changed = false;
			}
			return this._view;
		}
	},
	
	_cam : {
	    value : null,
		writable: true,
	},
	
	// update the camera position, this is a very crude way to do this,
	// there is no consideration for the frame rate, so on faster machines
	// we will move faster... awesome..
	update: {
        value: function() {
		
            var direction = [0, 0, 0];
            var speed = 5;
  
            if (this._pressed['W'.charCodeAt(0)])
                direction[1] += speed;

            if (this._pressed['S'.charCodeAt(0)])
                direction[1] -= speed;

            if (this._pressed['A'.charCodeAt(0)])
                direction[0] -= speed;

            if (this._pressed['D'.charCodeAt(0)])
                direction[0] += speed;

			mat4.identity(this._cam);
			mat4.rotateX(this._cam, this.angles[0]);
			mat4.rotateZ(this._cam, this.angles[2]);
			mat4.rotateY(this._cam, this.angles[1]);
			mat4.inverse(this._cam);

			// multiple the camera matrix by the direction vector
			mat4.multiplyVec3(this._cam, direction);

			vec3.add(this.position, direction);
			
			this._changed = true;
        }
    },
	
	init: {
	    value: function(canvas) {
		    this.angles = vec3.create();
			this.position = vec3.create();
			this._view = mat4.create();
			this._cam = mat4.create();
			this._pressed = new Array(128);
			
			var moving = false;
			var lastX = 0;
			var lastY = 0;
			var self = this; /* take a copy of this, object so the event listeners use the correct object */
			
			canvas.addEventListener('mousedown', function(event) {
				
				lastX = event.pageX;
				lastY = event.pageY;
				
			    if (event.which == 1) {
				    moving = true;
				}
			});
			
			canvas.addEventListener('mouseup', function(event) {
                moving = false;
            });
			
			canvas.addEventListener('mousemove', function(event) {
			    if (moving) {
				    var deltaX = lastX - event.pageX;
					var deltaY = lastY - event.pageY;
					
					// TODO: handle these wrapping around
					self.angles[1] -= deltaX * 0.025;
					self.angles[0] -= deltaY * 0.025;	
					
					lastX = event.pageX;
					lastY = event.pageY;
					
					self._changed = true;
				}
			});
			
			window.onkeydown = function(event) {
                self._pressed[event.keyCode] = true;
            }

            window.onkeyup = function(event) {
                self._pressed[event.keyCode] = false;
            }
			
		    return this;
		}
	},

});