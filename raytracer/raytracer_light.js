window.onload = function(){
	var canvas = document.getElementById("balls");
	var canvas_context = canvas.getContext("2d");
	var canvas_buffer = canvas_context.getImageData(0,0,canvas.width, canvas.height);
	var canvas_pitch = canvas_buffer.width*4;
	var Vw = 1;
	var Vy = 1;
	var depth = 1;
	var O = [0,0,0];

	// create an object constructor for spheres
	function Sphere(center,radius,color,specular){
		this.center = center;
		this.radius = radius;
		this.color = color;
		//add specular for the ball
		this.specular = specular;
	}
	
	var sphere1 = new Sphere([0,-1,3],1,[255,0,0],500);
	var sphere2 = new Sphere([2,0,4],1,[0,0,255], 500);
	var sphere3 = new Sphere([-2,0,4],1,[0,255,0],10);
	//add a big yellow sphere
	var sphere4 = new Sphere([0,-5001,0],5000,[255,255,0],1000);
   
	var spheres = [sphere1, sphere2, sphere3,sphere4];
        
	// create an object constructor for lights
	function Light(type,intensity,position,direction){
		this.type = type;
		this.intensity = intensity;
		this.position = position;
		this.direction = direction;
	}

	var light1 = new Light("ambient", 0.2, null, null);
	var light2 = new Light("point", 0.6, [2,1,0], null);
	var light3 = new Light("directional", 0.2, null,[1,4,4]);

	var lights = [light1, light2, light3, ];

	var PutPixel = function(x,y,color){
		x = canvas.width/2 + x;
		y = canvas.height/2 - y - 1;
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

	// The CanvaToViewport function
	var CanvasToViewport = function(x,y){
		return [x*Vw/canvas.width, y*Vy/canvas.height,depth];
	};
			
	// function to calculate the intersections if any
	var IntersectRaySphere = function(O,D,sphere){
		r =sphere.radius;
		CO = Subtract(O,sphere.center);
		a = Dot(D,D);
		b = 2*Dot(CO,D);
		c = Dot(CO,CO) - r*r;

		discriminant = b*b - 4*a*c;
		if(discriminant < 0){
			return [window.Infinity,window.Infinity];
		}
		t1 = (-b + Math.sqrt(discriminant))/(2*a);
		t2 = (-b - Math.sqrt(discriminant))/(2*a);
		return [t1,t2];
	};

	//compute light intensity given several types of light source
	var ComputeLighting= function(P,N,V,s){
		var intensity = 0.0;
		var light_direction = null;
		for(var i=0; i<lights.length;i++){
			// add ambient source contribution
			if(lights[i].type == "ambient"){
				intensity += lights[i].intensity;
			}else{
				if (lights[i].type == "point"){
					// calculate direction for point light source
					light_direction = Subtract(lights[i].position, P);
				} else {
					// directional light source
					light_direction = lights[i].direction;
				}
				// add the effect of diffuse reflection
				var n_dot_l = Dot(N,light_direction);
				if(n_dot_l>0){
					intensity += lights[i].intensity*n_dot_l/(Vlength(N)*Vlength(light_direction));
				}
				// add the effect of specular reflection
				if(lights[i].specular!=-1){

					var R = Subtract(Smul(2*n_dot_l,N),light_direction); 
					var r_dot_v = Dot(R,V);
					if(r_dot_v>0){
						intensity += lights[i].intensity*Math.pow(Dot(R,V)/(Vlength(R)*Vlength(V)),s);
					}
				}
			}
		}
		if(intensity>=1.0){
			return 1.0;
		}else{
		return intensity;
		}
	};

	// Raytracing function
	var TraceRay = function(O,D,t_min,t_max){
		var closest_t = window.Infinity;
		var closest_sphere = null;
				
		for (var i=0; i<spheres.length;i++ ){
			var two_point = IntersectRaySphere(O,D,spheres[i]);
			var t1 = two_point[0];
			var t2 = two_point[1];
			if ((t1>=t_min) && (t1<=t_max) && (t1<closest_t)){
				closest_t = t1;
				closest_sphere = spheres[i];
				}
					
			if ((t2>=t_min) && (t2<=t_max) && (t2<closest_t)){
				closest_t = t2;
				closest_sphere = spheres[i];
				}

		}
		if(closest_sphere == null){
				return [255,255,255];
		}
		// compute the intersection point on the closest sphere
		var P = Add(O, Smul(closest_t,D));
		// computer sphere normal at intersection
		var N = Subtract(P, closest_sphere.center);
		N = Sdiv(N,Vlength(N));
		var V = Subtract(O,P);
		return Smul(ComputeLighting(P,N,V,closest_sphere.specular),closest_sphere.color);
	};

	//let us do the raytracing
	for (var x=-Math.floor(canvas.width/2);x<=Math.floor(canvas.width/2);x++){
		for (var y=-Math.floor(canvas.height/2);y<=Math.floor(canvas.height/2);y++){
			D = CanvasToViewport(x,y);
			color = TraceRay(O,D,1,window.Infinity);
			PutPixel(x,y,color);
		}
	}
	UpdateCanvas();
};
