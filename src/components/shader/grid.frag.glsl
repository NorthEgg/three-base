// 详见 https://www.shadertoy.com/view/MdlGRr
precision highp float;
varying vec4 vPosition;
// This helper function returns 1.0 if the current pixel is on a grid line, 0.0 otherwise
float IsGridLine(vec2 fragCoord) {
	// Define the size we want each grid square in pixels
    vec2 vPixelsPerGridSquare = vec2(5.0, 5.0);

	// fragCoord is an input to the shader, it defines the pixel co-ordinate of the current pixel
    vec2 vScreenPixelCoordinate = fragCoord.xy;

	// Get a value in the range 0->1 based on where we are in each grid square
	// fract() returns the fractional part of the value and throws away the whole number part
	// This helpfully wraps numbers around in the 0->1 range
    vec2 vGridSquareCoords = fract(vScreenPixelCoordinate / vPixelsPerGridSquare);

	// Convert the 0->1 co-ordinates of where we are within the grid square
	// back into pixel co-ordinates within the grid square 
    vec2 vGridSquarePixelCoords = vGridSquareCoords * vPixelsPerGridSquare;

	// step() returns 0.0 if the second parmeter is less than the first, 1.0 otherwise
	// so we get 1.0 if we are on a grid line, 0.0 otherwise
    vec2 vIsGridLine = step(vGridSquarePixelCoords, vec2(0.5));

	// Combine the x and y gridlines by taking the maximum of the two values
    float fIsGridLine = max(vIsGridLine.x, vIsGridLine.y);

	// return the result
    return fIsGridLine;
}

// main is the entry point to the shader. 
// Our shader code starts here.
// This code is run for each pixel to determine its colour
void mainImage(out vec4 fragColor, in vec2 fragCoord, in vec4 csm_FragColor) {
    vec3 vResult = vec3(0.0);
    vResult.b = IsGridLine(fragCoord);
    float fIsMousePointerPixelB = 0.0;
    vResult.b = max(vResult.b, 0.0);
    if(vResult.b == 0.0) {
        fragColor = csm_FragColor;
    } else {
        fragColor = vec4(vResult, 1.0);
    }
}

void main() {
    vec4 color;
    mainImage(color, vPosition.xy, csm_FragColor);
    csm_FragColor = csm_FragColor * color;
}