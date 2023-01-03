       window.onload = function(){
			var canvas = document.getElementById("triangle");
			var canvas_context = canvas.getContext("2d");
			var canvas_buffer = canvas_context.getImageData(0,0,canvas.width, canvas.height);
			var canvas_pitch = canvas_buffer.width*4;
                        var Vw = 2;
	                var Vy = 2;
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

	           // Draw the outline of a triangle
	           var DrawWireframeTriangle = function(P0, P1,P2,color){
			   DrawLine(P0, P1, color);
			   DrawLine(P1, P2, color);
			   DrawLine(P2, P0, color);
		   };

	       // Fill the inside of a triangle with a color
	       // for each horizontal line y between the triangle's top and bottom
	       //     compute x_left and x_right for this y
	       //     DrawLine(x_left, x_right, y);
                   function DrawShadedFilledTriangle(P0,P1,P2,color){
			   //sort the points so that y0 <= y1 <= y2
			   if(P1.y<P0.y){
				   var tmp = P0;
				   P0 = P2;
				   P2 = tmp;
			   }
			   if(P2.y<P0.y){
				   var tmp = P2;
				   P2 = P0;
				   P0 = tmp;
			   }
			   if(P2.y<P1.y){
				   var tmp = P2;
				   P2 = P1;
				   P1 = tmp;
			   }
			   // Compute the x coordinates of the triangle edges
			   var x01 = Interpolate(P0.y, P0.x, P1.y, P1.x);
			   var x12 = Interpolate(P1.y, P1.x, P2.y, P2.x);
			   var x02 = Interpolate(P0.y, P0.x, P2.y, P2.x);

			   // Compute the intensity of color for each edge using interpolation
			   var h01 = Interpolate(P0.y, P0.h, P1.y, P1.h);
			   var h12 = Interpolate(P1.y, P1.h, P2.y, P2.h);
			   var h02 = Interpolate(P0.y, P0.h, P2.y, P2.h);

			   // Concatenate two short sides
			   x01.pop();
			   var x012 = x01.concat(x12);

			   // Concatenate the intensity of wo short sides
			   h01.pop();
			   var h012 = h01.concat(h12);

			   //Determine which is left and which is right
			   var x_left = x02;
			   var x_right = x012;
			   var h_left = h02;
			   var h_right = h012;

			   var m = Math.floor(x012.length/2);
			   if(x012[m]<x02[m]){
				   x_left = x012;
				   x_right = x02;
				   h_left =  h012;
				   h_right = h02;
			   }

			   // define a vector function
			   function Smul(scalar, vector){
				   return[vector[0]*scalar, vector[1]*scalar, vector[2]*scalar];
			   }

			   //Draw the horizontal segments
			   for (var y =P0.y;y<P2.y;y++){
				   var x_left_end = x_left[y-P0.y];
				   var h_segment = Interpolate(x_left_end,h_left[y-P0.y],x_right[y-P0.y],h_right[y-P0.y]);
				   for(var x=x_left_end;x<x_right[y-P0.y];x++){
					   PutPixel(x,y,Smul(h_segment[x-x_left_end],color));
				   }
			   }
		   }
                   
	           var P1 = {x:150, y:0, h:1};
	           var P0 = {x:0, y:150, h:0.1};
	           var P2 = {x:-150, y:-150, h:0.5};

                   DrawWireframeTriangle(P0,P1,P2,[255,0,0]);
	           DrawShadedFilledTriangle(P0,P1,P2,[0,255,0]);
	           UpdateCanvas();

       };
