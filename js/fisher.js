var Pi=Math.PI; var PiD2=Pi/2; var PiD4=Pi/4; var Pi2=2*Pi
function Sqrt(x) { return Math.sqrt(x) }
function Power(x,y) { return Math.pow(x,y) }
function Sum(v1,v2) {
  rsum = v1/1+v2/1
  return rsum
}

function fac(z) {
  if (z==0) { return 1 }
  if (z>1) { return z*fac(z-1) }
  else { return z }
}

function round(number,X) {
  // rounds number to X decimal places, defaults to 8
  X = (!X ? 8 : X);
  return Math.round(number*Math.pow(10,X))/Math.pow(10,X);
}

function fishersExact(f11, f12, f21, f22) {
	var results = {};
	r1=Sum(f11,f12);
	r2=Sum(f21,f22);
	c1=Sum(f11,f21);
	c2=Sum(f12,f22);

	results.r1=r1;
	results.r2=r2;
	results.c1=c1;
	results.c2=c2;
	results.total=Sum(r1,r2);

	if (r1<=r2) { if (c1<=c2) { a=f11;b=f12;c=f21;d=f22 } }
	if (r1<=r2) { if (c2<=c1) { a=f12,b=f22;c=f11;d=f21 } }
	if (r2<=r1) { if (c1<=c2) { a=f21;b=f11;c=f22;d=f12 } }
	if (r2<=r1) { if (c2<=c1) { a=f22;b=f21;c=f12;d=f11 } }
	if (b<a) { 
		z=c;c=a;a=b;b=d;d=z;
	} else if (c<a) { 
		z=b;b=a;a=c;c=d;d=z;
	}
	
	p1=0;temp=a;ratio=0;z=0;mode=0;
	
	for (i=0;i=10000;i++) {
		ab=Sum(a,b); ac=Sum(a,c); bd=Sum(b,d); cd=Sum(c,d); abcd=Sum(ab,cd);
		x1=fac(ab); x2=fac(ac); x3=fac(bd); x4=fac(cd);
		y1=fac(a); y2=fac(b); y3=fac(c); y4=fac(d);
		
		for (i=0; i<2; i++) {
		  if (x2>x1) { z=x1;x1=x2;x2=z }
		  if (x3>x2) { z=x2;x2=x3;x3=z }
		  if (x4>x3) { z=x3;x3=x4;x4=z }
		}
		for (i=0; i<2; i++) {
		  if (y2>y1) { z=y1;y1=y2;y2=z }
		  if (y3>y2) { z=y2;y2=y3;y3=z }
		  if (y4>y3) { z=y3;y3=y4;y4=z }
		}
		ra1 = x1/y1; ra2=x2/y2; ra3=x3/y3; ra4=x4/y4; ra5=1/fac(abcd);
		ratio=ra1*ra2*ra3*ra4*ra5;
		if (p1==0) { aaron=ratio; }
		p1=Sum(p1,ratio)
		if (ratio>mode) { mode=ratio }
		a=Sum(a,-1); b=Sum(b,1); c=Sum(c,1); d=Sum(d,-1);
		if (a<0) { break }
		if (b<0) { break }
		if (c<0) { break }
		if (d<0) { break }
	}
	revflag=0;
	if (mode>aaron) { p1=1-p1+aaron; revflag=1; }
	
  	results.lowerTail=round(p1,8);
	results.upperTail=round(1-p1+aaron,8);

	if (r1<=r2) { if (c1<=c2) { a=f11;b=f12;c=f21;d=f22 } }
	if (r1<=r2) { if (c2<=c1) { a=f12,b=f22;c=f11;d=f21 } }
	if (r2<=r1) { if (c1<=c2) { a=f21;b=f11;c=f22;d=f12 } }
	if (r2<=r1) { if (c2<=c1) { a=f22;b=f21;c=f12;d=f11 } }
	if (b<a) { 
		z=c;c=a;a=b;b=d;d=z;
	} else if (c<a) { 
		z=b;b=a;a=c;c=d;d=z;
	}
	p2=0;ratio=0;flag=0;
	for (i=0;i=10000;i++) {
		if (revflag==0) {
			a=Sum(a,1);b=Sum(b,-1);c=Sum(c,-1);d=Sum(d,1);
		} else if (revflag==1) { 
			a=Sum(a,-1);b=Sum(b,1);c=Sum(c,1);d=Sum(d,-1);
		}
		if (a<0) { break }
		if (b<0) { break }
		if (c<0) { break }
		if (d<0) { break }
		ab=Sum(a,b);ac=Sum(a,c);bd=Sum(b,d);cd=Sum(c,d);abcd=Sum(ab,cd);
		x1=fac(ab);x2=fac(ac);x3=fac(bd);x4=fac(cd);
		y1=fac(a);y2=fac(b);y3=fac(c);y4=fac(d);
		for (i=0;i<2;i++) {
		  if (x2>x1) { z=x1;x1=x2;x2=z }
		  if (x3>x2) { z=x2;x2=x3;x3=z }
		  if (x4>x3) { z=x3;x3=x4;x4=z }
		}
		for (i=0;i<2;i++) {
		  if (y2>y1) { z=y1;y1=y2;y2=z }
		  if (y3>y2) { z=y2;y2=y3;y3=z }
		  if (y4>y3) { z=y3;y3=y4;y4=z }
		}
		ra1=x1/y1;ra2=x2/y2;ra3=x3/y3;ra4=x4/y4;ra5=1/fac(abcd);
		ratio=ra1*ra2*ra3*ra4*ra5;
		if (ratio<=(aaron+.000000001)) { flag=1; }
		if (flag==1) { p2=Sum(p2,ratio); }
	}
  	var p = Sum(p1,p2);
  	
  	if (isNaN(p) || p < 0.0001) {
	  	results.pValue = "P < 0.0001";
  	} else if (p < 0.001) {
  		results.pValue = "P < 0.001";
  	} else {
  		results.pValue = "P = " + p.toFixed(3);
  	}	
  	
  	return results;
}
