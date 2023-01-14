       window.onload = function(){
			var canvas = document.getElementById("cubes");
			var canvas_context = canvas.getContext("2d");
			var canvas_buffer = canvas_context.getImageData(0,0,canvas.width, canvas.height);
			var canvas_pitch = canvas_buffer.width*4;
                        var Vw = 2;
	                var Vy = 2;
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
	// linear algebra helpers
	
	var Dot = function(v1,v2){
		return v1[0]*v2[0] + v1[1]*v2[1]+v1[2]*v2[2];
	};

	var Add = function(v1,v2){
		return [v1[0]+v2[0], v1[1]+v2[1], v1[2]+v2[2]];
	};

	var Smul = function(scalar,vector){
		return [scalar*vector[0],scalar*vector[1],scalar*vector[2]];
	};

	var Sdiv = function(vector,scalar){
		return [vector[0]/scalar, vector[1]/scalar,vector[2]/scalar];
	};

	var Vlength = function(vector){
		return Math.sqrt(Dot(vector,vector));
	};

	var Subtract = function(v1,v2){
		return [v1[0]-v2[0],v1[1]-v2[1],v1[2]-v2[2]];
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


	var vertex_models = [[1,1,1],
			[-1,1,1],
			[-1,-1,1],
			[1,-1,1],
			[1,1,-1],
			[-1,1,-1],
			[-1,-1,-1],
			[1,-1,-1]];


	var triangle_models = [[[0,1,2],[255,0,0]],
			 [[0,2,3],[255,0,0]],
			 [[4,0,3],[0,255,0]],
			 [[4,3,7],[0,255,0]],
			 [[5,4,7],[0,0,255]],
			 [[5,7,6],[0,0,255]],
			 [[1,5,6],[247,171,0]],
			 [[1,6,2],[247,171,0]],
			 [[4,5,1],[255,0,255]],
			 [[4,1,0],[255,0,255]],
			 [[2,6,7],[0,255,255]],
			 [[2,7,3],[0,255,255]]];

        function CubeModel(triangle_models, vertex_models, transforms){
		this.triangle_models = triangle_models;
		this.vertex_models = vertex_models;
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
	function Cube(triangles, vertices, bounding_sphere){
		this.triangles = triangles;
		this.vertices = vertices;
		if(bounding_sphere){
			this.bounding_sphere = bounding_sphere;
		}else{
		var center = [0,0,0];
		for(var i =0;i<vertices.length;i++){
			var vertex = [vertices[i].x, vertices[i].y, vertices[i].z];
			center = Add(center,vertex);
		}

		center = Sdiv(center,8);

		var v = [vertices[0].x, vertices[0].y, vertices[0].z];
		var r = Vlength(Subtract(v,center));
		center = new Vertex(center[0],center[1],center[2]);
		this.bounding_sphere = {center:center,r:r};
		} 
		
	}
        var I = [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];
	var models = [new CubeModel(triangle_models, vertex_models, {trl:[-2,0,4],rot:I,scale:[1,1,1]}), 
		       new CubeModel(triangle_models, vertex_models, {trl:[3,3,5],rot:I,scale:[1,1,1]}),
		       new CubeModel(triangle_models, vertex_models, {trl:[3,-3,4],rot:I,scale:[1,1,1]}),

	               new CubeModel(triangle_models, vertex_models, {trl:[9,-2,6],rot:I,scale:[1,1,1]})];


	function RenderTriangle(triangle){
		DrawWireframeTriangle(ProjectVertex(triangle[0]),
			              ProjectVertex(triangle[1]),
				      ProjectVertex(triangle[2]),
				      triangle[3]);

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

        function Plane(name, normal, D){
		this.name = name;

		this.normal = normal;

		this.D = D;
	}
	
	var rroot2 = 1/Math.sqrt(2);
	
	// the five planes define the clipping volume
	var planes = [new Plane("near", [0,0,1], -d),
		      new Plane("left", [rroot2,0,rroot2],0),
		      new Plane("right", [-rroot2,0,rroot2],0),
		      new Plane("bottom", [0,rroot2,rroot2],0),
		      new Plane("top", [0,-rroot2,rroot2],0)];


	function RenderObject(model, tmatrix, planes){
		var vertices = [];
		var triangles = [];
		for(var i=0;i<model.vertex_models.length;i++){
			var vmodel = model.vertex_models[i];
			var transformed_vertex = transform(new Vertex(vmodel[0],vmodel[1],vmodel[2]),tmatrix);
			vertices.push(transformed_vertex);
		}
		for(var i=0;i<model.triangle_models.length;i++){
			var tmodel = model.triangle_models[i];
			var triangle = [vertices[tmodel[0][0]],vertices[tmodel[0][1]],vertices[tmodel[0][2]],tmodel[1]];
		        triangles.push(triangle);	
  		}
		// create a transformed cube instance
		var cube = new Cube(triangles,vertices,null);
		// clipping
		var clipped_cube = ClipInstance(cube,planes);
		if(clipped_cube==null){
			return;
		}
		console.log(clipped_cube.triangles.length);
		for(var i=0; i<clipped_cube.triangles.length;i++){
			RenderTriangle(clipped_cube.triangles[i]);
		}
	}
        
        function MakeCameraMatrix(cposition, corient){
		// stub, always return the identity matrix
		return I;
	}

	function RenderScene(planes){
             // camera rotation and translation matrix
             var M_camera = MakeCameraMatrix([0,0,0], [0,0,1]);
	     
	     for(var i= 0; i<models.length;i++){
		var M = mmul(M_camera, models[i].tmatrix);
        	RenderObject(models[i],M,planes);
	     }
	}

	function SignedDistance(plane, vertex){
		var normal = plane.normal;
		return (vertex.x * normal[0])+
			(vertex.y * normal[1])+
			(vertex.z*normal[2])+
			plane.D;
	}
	function Intersection(v1, v2, plane){
		var a = plane.normal[0];
		var b = plane.normal[1];
		var c = plane.normal[2];
		var d = plane.D;
		var t = (-d-a*v1.x-b*v1.y-c*v1.z)/(a*(v2.x-v1.x)+b*(v2.y-v1.y)+c*(v2.z-v1.z));
		return new Vertex(v1.x+t*(v2.x-v1.x),v1.y+t*(v2.y-v1.y),v1.z+t*(v2.z-v1.z));

	}

	function ClipTriangle(triangle, plane){

		var d0 = SignedDistance(plane, triangle[0]);
		var d1 = SignedDistance(plane, triangle[1]);
		var d2 = SignedDistance(plane, triangle[2]);
                
		if((d0 >= 0) && (d1 >= 0) && (d2 >= 0)){
			return [triangle];
		} else if((d0 <= 0) && (d1 <= 0) && (d2 <= 0)){
			return [];
		} else if ((d0 >= 0) && (d1 <= 0) && (d2 <= 0)){
			var vA_ = triangle[0];
			var vB_ = Intersection(vA_, triangle[1], plane);
			var vC_ = Intersection(vA_, triangle[2], plane);
			return [[vA_, vB_, vC_, triangle[3]]];
		} else if ((d0 <= 0) && (d1 >= 0) && (d2 <= 0)){
			var vA_ = triangle[1];
			var vB_ = Intersection(vA_, triangle[0], plane);
			var vC_ = Intersection(vA_, triangle[2], plane);
			return [[vA_, vB_, vC_, triangle[3]]];
		} else if ((d0 <= 0) && (d1 <= 0) && (d2 >= 0)){
			var vA_ = triangle[2];
			var vB_ = Intersection(vA_, triangle[1], plane);
			var vC_ = Intersection(vA_, triangle[0], plane);
			return [[vA_, vB_, vC_, triangle[3]]];
		} else if ((d0 <= 0) && (d1 >= 0) && (d2 >= 0)){
			var vC = triangle[0];
			var vA = triangle[1];
			var vB = triangle[2];
			var vA_ = Intersection(vA, vC, plane);
			var vB_ = Intersection(vB, vC, plane);
			return [[vA, vB, vA_, triangle[3]], [vA_, vB, vB_, triangle[3]]];
		} else if ((d0 >= 0) && (d1 <= 0) && (d2 >= 0)){
			var vC = triangle[1];
			var vA = triangle[0];
			var vB = triangle[2];
			var vA_ = Intersection(vA, vC, plane);
			var vB_ = Intersection(vB, vC, plane);
			return [[vA, vB, vA_, triangle[3]], [vA_, vB, vB_, triangle[3]]];
		} else if ((d0 >= 0) && (d1 >= 0) && (d2 <= 0)){
			var vC = triangle[2];
			var vA = triangle[1];
			var vB = triangle[0];
			var vA_ = Intersection(vA, vC, plane);
			var vB_ = Intersection(vB, vC, plane);
			return [[vA, vB, vA_, triangle[3]], [vA_, vB, vB_, triangle[3]]];
	        }
		
	}

        function ClipTriangleAgainstPlane(triangles, plane){
		var clipped_triangles = [];
		for(var i=0;i<triangles.length;i++){
			var clipped  =ClipTriangle(triangles[i],plane);
		        console.log(clipped);
			clipped_triangles = clipped_triangles.concat(clipped);
		}
		return clipped_triangles;
	}
	       
	function CubeCopy(instance){
		return new Cube(instance.triangles, instance.vertices, instance.bounding_sphere);
	}

	function ClipInstanceAgainstPlane(instance, plane){
		var d = SignedDistance(plane, instance.bounding_sphere.center);
		var r = instance.bounding_sphere.r;
		if(d>r){
			return instance;

		}
		        else if(d<-r){
			return null;
		} else{
			var clipped_instance = CubeCopy(instance);
			clipped_instance.triangles = ClipTriangleAgainstPlane(instance.triangles,plane);
			return clipped_instance;
		}
	}
	     
	function ClipInstance(instance, planes){
		for(var j=0;j<planes.length;j++){
			instance = ClipInstanceAgainstPlane(instance, planes[j]);
			if(instance==null){
				return null;
			}
		}
		       
		return instance;
	}

	RenderScene(planes);
	UpdateCanvas();
};
