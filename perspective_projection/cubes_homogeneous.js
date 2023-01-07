       window.onload = function(){
			var canvas = document.getElementById("cubes");
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
					var xs = Interpolate(P0.y, P0.x, P1.y, P1.x);
					
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


	//Project 3D cubes
	

	//The homogeneous coordinates of a vertex
	function Vertex(x,y,z){
		this.x = x;
		this.y = y;
		this.z = z;
		this.fourth = 1;
	}
	var vertices = [new Vertex(1,1,1),
			new Vertex(-1,1,1),
			new Vertex(-1,-1,1),
			new Vertex(1,-1,1),
			new Vertex(1,1,-1),
			new Vertex(-1,1,-1),
			new Vertex(-1,-1,-1),
			new Vertex(1,-1,-1)];

	function Triangle(v, color, id){
		this.v = v;
		this.color = color;
		this.id = id;
	}

	var triangles = [new Triangle([0,1,2],[255,0,0],0),
			 new Triangle([0,2,3],[255,0,0],1),
			 new Triangle([4,0,3],[0,255,0],2),
			 new Triangle([4,3,7],[0,255,0],3),
			 new Triangle([5,4,7],[0,0,255],4),
			 new Triangle([5,7,6],[0,0,255],5),
			 new Triangle([1,5,6],[247,171,0],6),
			 new Triangle([1,6,2],[247,171,0],7),
			 new Triangle([4,5,1],[255,0,255],8),
			 new Triangle([4,1,0],[255,0,255],9),
			 new Triangle([2,6,7],[0,255,255],10),
			 new Triangle([2,7,3],[0,255,255],11)];

        function Cube(triangles, vertices, transforms){
		this.triangles = triangles;
		this.vertices = vertices;
		var translation = [[1,0,0,transforms.trl[0]],
				   [0,1,0,transforms.trl[1]],
				   [0,0,1,transforms.trl[2]],
				   [0,0,0,1]];
		var rotation = transforms.rot;
		var scale = [[transforms.scale[0],0,0,0],
			     [0,transforms.scale[1],0,0],
			     [0,0,transforms.scale[2],0],
			     [0,0,0,1]];

		this.tmatrix = mmul(translation,mmul(rotation, scale));
		
	}
        var I = [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];
	var objects = [new Cube(triangles, vertices, {trl:[-1.5,0,4],rot:I,scale:[0.5,0.5,0.5]}), 
		       new Cube(triangles, vertices, {trl:[3,2,5],rot:I,scale:[1,1,1]}),
		       new Cube(triangles, vertices, {trl:[-8,0,6],rot:I,scale:[1.5,1.5,1.5]}),
	               new Cube(triangles, vertices, {trl:[9,-2,6],rot:I,scale:[1,1,1]})];


	function RenderTriangle(triangle, projected){
		DrawWireframeTriangle(projected[triangle.v[0]],
			              projected[triangle.v[1]],
				      projected[triangle.v[2]],
				      triangle.color);

	}

	function transform(vertex, tmatrix){
	       var v = [[vertex.x], [vertex.y], [vertex.z],[1]];
	       var result = mmul(tmatrix,v);
	       var x = result[0][0];
	       var y = result[1][0];
	       var z = result[2][0];
               return new Vertex(x,y,z); 
	}

	function mmul(a,b){
 		var d1 = a.length;
  		var d2 = b[0].length;
  		var result = new Array(d1);
  		for(var i=0;i<d1;i++){
    			result[i] = new Array(d2);
    			for(var j=0;j<d2;j++){
      				var tempsum = 0;
      				for(var k=0;k<b.length;k++){
          				tempsum+= a[i][k]*b[k][j];
      				}
      			result[i][j] = tempsum;
    			}
  		}
  		return result;
	}

	function RenderObject(cube, tmatrix){
		var projected = [];
		for(var i = 0;i<cube.vertices.length;i++){
			projected.push(ProjectVertex(transform(cube.vertices[i],tmatrix)));
		}
		for(var i=0; i<cube.triangles.length;i++){
			RenderTriangle(cube.triangles[i],projected);
		}
	}
        
        function MakeCameraMatrix(cposition, corient){
		// stub, always return the identity matrix
		return I;
	}
	function RenderScene(){
             // camera rotation and translation matrix
             var M_camera = MakeCameraMatrix([0,0,0], [0,0,1]);
	     for(var i= 0; i<objects.length;i++){
		var M = mmul(M_camera, objects[i].tmatrix);
        	RenderObject(objects[i],M);
	     }
	}

	RenderScene();
	UpdateCanvas();
       };
