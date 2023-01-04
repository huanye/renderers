       window.onload = function(){
			var canvas = document.getElementById("cube");
			var canvas_context = canvas.getContext("2d");
			var canvas_buffer = canvas_context.getImageData(0,0,canvas.width, canvas.height);
			var canvas_pitch = canvas_buffer.width*4;
                        var Vw = 5;
	                var Vy = 5;
	                var d = 1;
			var PutPixel = function(x,y,color){
				x = canvas.width/2 + (x|0);
				y = canvas.height/2 - (y|0) - 1;
			        if( x < 0 || x >= canvas.width || y<0 || y>= canvas.height){return;}
                                var offset = 4*x + canvas_pitch*y;
				canvas_buffer.data[offset++] = color[0];
				canvas_buffer.data[offset++] = color[1];
				canvas_buffer.data[offset++] = color[2];
				canvas_buffer.data[offset++] = 255;

			};

			var UpdateCanvas = function(){
				canvas_context.putImageData(canvas_buffer,0,0);
			};

	                function ViewportToCanvas(x_,y_){
				return {x:x_*canvas.width/Vw, y:y_*canvas.height/Vy};
			}

                        // perspective projection of a 3D point v on a viewportof depth d from the viewpoint located on the origin
	                function ProjectVertex(v){
				return ViewportToCanvas(v.x*d/v.z, v.y*d/v.z);
			}

	                // interpolate the middle point sets based on two endpoints
	                var Interpolate = function(i0,d0,i1,d1){
				if(i0==i1){
					return [d0];
				}
				var values = new Array();
				var a = (d1-d0)/(i1-i0);
				var d = d0;
				for (var i=i0;i<=i1;i++){
					values.push(d);
					d = d + a;
				}
				console.log(values);
				return values;
			};

	                // draw lines connecting P0 and P1 with certain color
	                var DrawLine = function(P0, P1, color){
				if(Math.abs(P1.x - P0.x)>Math.abs(P1.y - P0.y)){
					// Line is horizontal-ish
					// Make sure P0.x < P1.x
					if(P0.x > P1.x){
						var tmp  = P1;
						P1 = P0;
						P0 = tmp;
					}
					var ys = Interpolate(P0.x, P0.y, P1.x, P1.y);
					console.log(ys);
					for (var x=P0.x;x<=P1.x;x++){
						PutPixel(x, ys[x-P0.x],color);

					}
				}
				else{
					// Line is vertical-ish
					// Make sure P0.y < P1.y
					if(P0.y > P1.y){
						var tmp = P1;
						P1 = P0;
						P0 = tmp;
					}
					var xs = Interpolate(P0.y,P0.x,P1.y,P1.x);
					for (var y=P0.y;y<=P1.y;y++){
						PutPixel(xs[y-P0.y],y,color);
					}
				}
			};


	//Project a 3D cube naively
	

	//The coordinates of four "front" vertices
	vAf = {x:-3, y:1, z:3};
	vBf = {x:-1, y:1, z:3};
	vCf = {x:-1, y:-1,z:3};
	vDf = {x:-3, y:-1, z:3};

	//The coordinates of four "back" vertices
	vAb = {x:-3, y:1, z:4};
	vBb = {x:-1, y:1, z:4};
	vCb = {x:-1, y:-1,z:4};
	vDb = {x:-3, y:-1,z:4};

	// The front face
	DrawLine(ProjectVertex(vAf),ProjectVertex(vBf), [0,0,255]);
	DrawLine(ProjectVertex(vBf),ProjectVertex(vCf), [0,0,255]);
	DrawLine(ProjectVertex(vCf),ProjectVertex(vDf), [0,0,255]);
	DrawLine(ProjectVertex(vDf),ProjectVertex(vAf), [0,0,255]);
	
	// The back face
	DrawLine(ProjectVertex(vAb),ProjectVertex(vBb), [255,0,0]);
	DrawLine(ProjectVertex(vBb),ProjectVertex(vCb), [255,0,0]);
	DrawLine(ProjectVertex(vCb),ProjectVertex(vDb), [255,0,0]);
	DrawLine(ProjectVertex(vDb),ProjectVertex(vAb), [255,0,0]);
	
	//front to back edges
	DrawLine(ProjectVertex(vAf),ProjectVertex(vAb), [0,255,0]);
	DrawLine(ProjectVertex(vBf),ProjectVertex(vBb), [0,255,0]);
	DrawLine(ProjectVertex(vCf),ProjectVertex(vCb), [0,255,0]);
	DrawLine(ProjectVertex(vDb),ProjectVertex(vDf), [0,255,0]);

	UpdateCanvas();
       };
