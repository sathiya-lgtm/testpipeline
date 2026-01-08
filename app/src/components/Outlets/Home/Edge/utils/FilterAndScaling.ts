/* eslint-disable no-restricted-properties */
/* eslint-disable no-plusplus */
/* eslint-disable no-continue */
/* eslint-disable consistent-return */
/* eslint-disable prefer-destructuring */
/* eslint-disable prefer-const */
/* eslint-disable prefer-exponentiation-operator */
function distanceBetween(p1: any, p2: any) {
    let d = Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
    return d;
}

function isOnSegment(p: any, s: any) {
    let px = p[0];
    let py = p[1];

    let s1x = s[0][0];
    let s1y = s[0][1];
    let s2x = s[1][0];
    let s2y = s[1][1];

    let dx1 = s2x - s1x;
    let dy1 = s2y - s1y;

    // skip the calculation to determine parallel lines. Since all our values are converted
    // to integers, it turns out that there are many combinations of coordinates which
    // cause this calculation to return 0, falsely indicating a parallel line
    //        let cross = dxc * dy1 - dyc * dx1;
    //        if (Math.abs(cross) < 1)
    //            return(false);

    if (Math.abs(dx1) >= Math.abs(dy1)) {
        return dx1 > 0 ? s1x <= px && px <= s2x : s2x <= px && px <= s1x;
    }
    return dy1 > 0 ? s1y <= py && py <= s2y : s2y <= py && py <= s1y;
}

function isBetween(p: any, e1: any, e2: any) {
    let x1;
    let x2;
    let y1;
    let y2;
    if (e1[0] <= e2[0]) {
        x1 = e1[0];
        x2 = e2[0];
    } else {
        x1 = e2[0];
        x2 = e1[0];
    }
    if (e1[1] <= e2[1]) {
        y1 = e1[1];
        y2 = e2[1];
    } else {
        y1 = e2[1];
        y2 = e1[1];
    }
    return p[0] >= x1 && p[0] <= x2 && p[1] >= y1 && p[1] <= y2;
}

export function needScaling(
    smallestFilterCenter: any,
    autoScaleMode: any,
    focalPointCenter: any,
    scaleLine: any
) {
    let ay = smallestFilterCenter[0];
    let ax = smallestFilterCenter[1];
    let by;
    let bx;
    let result;
    let scalePercent;

    if (autoScaleMode === 0) {
        // focal scaling
        let d = focalPointCenter;
        by = d.lat;
        bx = d.lng;
    } else {
        by = 1;
        bx = ax;
    }

    /*
     *  clues taken from https://www.geeksforgeeks.org/program-for-point-of-intersection-of-two-lines/
     */
    // this is the line defined with the scale2point and the size icon as end points
    let a1 = by - ay;
    let b1 = ax - bx;
    let c1 = a1 * ax + b1 * ay;

    // parse through the segments of scaleLine and look for an intersection
    let ll = scaleLine;
    let len = ll.length;
    let i;

    for (i = 0; i < len - 1; i++) {
        let cy = ll[i][0]; // current node
        let cx = ll[i][1];
        let dy = ll[i + 1][0]; // next node
        let dx = ll[i + 1][1];

        // this is a segment of the scaleLine
        let a2 = dy - cy;
        let b2 = cx - dx;
        let c2 = a2 * cx + b2 * cy;

        let det = a1 * b2 - a2 * b1;

        if (det === 0)
            // if the determinant is 0 the lines are parallel
            continue;
        else {
            let x = Math.round((b2 * c1 - b1 * c2) / det); // find the interesection
            let y = Math.round((a1 * c2 - a2 * c1) / det);

            // console.log(
            //   isOnSegment(
            //     [x, y],
            //     [
            //       [cx, cy],
            //       [dx, dy],
            //     ]
            //   )
            // );
            // console.log(isBetween([ax, ay], [x, y], [bx, by]));

            // since lines are infinite in either direction, if we are scaling in a circle (think fish-eye camera), then the line
            // will intersect on both sides. We determine if the object is between the point of intersection and the scale2point
            // to establish the correct location for scaling (or not)
            if (
                isOnSegment(
                    [x, y],
                    [
                        [cx, cy],
                        [dx, dy],
                    ]
                ) &&
                isBetween([ax, ay], [x, y], [bx, by])
            ) {
                let dTotal = distanceBetween([x, y], [bx, by]); // distance from the scaleLine segment to scale2point
                let dPart = distanceBetween([ax, ay], [bx, by]); // distance from scale icon to scale2oint

                if (dTotal > dPart) {
                    // ... then determine the 'side' on which our icon is found
                    scalePercent = dPart / dTotal;
                    result = true;
                    break;
                } else {
                    // scalePercent = 0.0;
                    result = false;
                    break;
                }
            }
        }
    }

    return { needScaling: result, scalePercent };
}

export function updateShading(
    captureResolution: any,
    scaleLine: any,
    focalPoint: any
) {
    let yMin = 1;
    let xMin = 1;
    let yMax = captureResolution.height - 1; // Y size of image
    let xMax = captureResolution.width - 1; // X size of image
    let m = scaleLine; // latitude/longitude (y,x) of center of scale to point
    let x0;
    let y0; // x,y of scale 2 point
    let x1;
    let y1; // x,y of scale line initial point
    let x2;
    let y2; // x,y of scale line terminal point
    let ix1;
    let iy1; // intersection point of line through x1, y1
    let ix2;
    let iy2; // intersection point of line through x2, y2
    let tv1;
    let tv2; // t solutions for intersections with vertical lines
    let th1;
    let th2; // t solutions for intersections with horizontal lines
    let idx;
    let shadow = [];
    let found1 = false;
    let found2 = false;

    x0 = Math.round(focalPoint[1]);
    y0 = Math.round(focalPoint[0]);
    idx = m.length - 1;
    y1 = Math.round(m[0][0]);
    x1 = Math.round(m[0][1]);
    y2 = Math.round(m[idx][0]);
    x2 = Math.round(m[idx][1]);

    // removeShadowLayer();

    // start with the scale line terminal vertex
    // if any denominator is 0, then there will be no intersection in that direction
    if (y2 - y0 !== 0) {
        tv2 = (yMax - y0) / (y2 - y0);
        tv1 = (yMin - y0) / (y2 - y0);
    } else {
        tv2 = undefined;
        tv1 = undefined;
    }
    if (x2 - x0 !== 0) {
        th2 = (xMax - x0) / (x2 - x0);
        th1 = (xMin - x0) / (x2 - x0);
    } else {
        th2 = undefined;
        th1 = undefined;
    }

    if (tv2 && tv2 < 0) tv2 = undefined;
    if (tv1 && tv1 < 0) tv1 = undefined;
    if (th2 && th2 < 0) th2 = undefined;
    if (th1 && th1 < 0) th1 = undefined;

    // if all t solutions are undefined, we have a problem
    if (
        tv2 === undefined &&
        tv1 === undefined &&
        th2 === undefined &&
        th1 === undefined
    )
        alert('Intersection problem for scale terminal vertex');
    else {
        // we should have only two values of t which are positive: one at the intersection with the vertical
        // boundary, and one at the horizontal boundary. We calculate the x,y points for each and select
        // the point actually on the boundary of the rectangle.

        if (tv2 !== undefined) {
            ix2 = Math.round(x0 + (x2 - x0) * tv2);
            iy2 = Math.round(y0 + (y2 - y0) * tv2);
            if (ix2 >= xMin && ix2 <= xMax && iy2 >= yMin && iy2 <= yMax)
                found2 = true;
        }
        if (tv1 !== undefined && found2 === false) {
            ix2 = Math.round(x0 + (x2 - x0) * tv1);
            iy2 = Math.round(y0 + (y2 - y0) * tv1);
            if (ix2 >= xMin && ix2 <= xMax && iy2 >= yMin && iy2 <= yMax)
                found2 = true;
        }
        if (th2 !== undefined && found2 === false) {
            ix2 = Math.round(x0 + (x2 - x0) * th2);
            iy2 = Math.round(y0 + (y2 - y0) * th2);
            if (ix2 >= xMin && ix2 <= xMax && iy2 >= yMin && iy2 <= yMax)
                found2 = true;
        }
        if (th1 !== undefined && found2 === false) {
            ix2 = Math.round(x0 + (x2 - x0) * th1);
            iy2 = Math.round(y0 + (y2 - y0) * th1);
            if (ix2 >= xMin && ix2 <= xMax && iy2 >= yMin && iy2 <= yMax)
                found2 = true;
        }
    }

    if (found2 === false)
        alert('Failed to find intersection for terminal point');

    // repeat for the scale line initial vertex
    // if any denominator is 0, then there will be no intersection in that direction
    if (y1 - y0 !== 0) {
        tv2 = (yMax - y0) / (y1 - y0);
        tv1 = (yMin - y0) / (y1 - y0);
    } else {
        tv2 = undefined;
        tv1 = undefined;
    }
    if (x1 - x0 !== 0) {
        th2 = (xMax - x0) / (x1 - x0);
        th1 = (xMin - x0) / (x1 - x0);
    } else {
        th2 = undefined;
        th1 = undefined;
    }

    if (tv2 && tv2 < 0) tv2 = undefined;
    if (tv1 && tv1 < 0) tv1 = undefined;
    if (th2 && th2 < 0) th2 = undefined;
    if (th1 && th1 < 0) th1 = undefined;

    // if all t solutions are undefined, we have a problem
    if (
        tv2 === undefined &&
        tv1 === undefined &&
        th2 === undefined &&
        th1 === undefined
    )
        alert('Intersection problem for scale terminal vertex');
    else {
        // we should have only two values of t which are positive: one at the intersection with the vertical
        // boundary, and one at the horizontal boundary. We calculate the x,y points for each and select
        // the point actually on the boundary of the rectangle.

        if (tv2 !== undefined) {
            ix1 = Math.round(x0 + (x1 - x0) * tv2);
            iy1 = Math.round(y0 + (y1 - y0) * tv2);
            if (ix1 >= xMin && ix1 <= xMax && iy1 >= yMin && iy1 <= yMax)
                found1 = true;
        }
        if (tv1 !== undefined && found1 === false) {
            ix1 = Math.round(x0 + (x1 - x0) * tv1);
            iy1 = Math.round(y0 + (y1 - y0) * tv1);
            if (ix1 >= xMin && ix1 <= xMax && iy1 >= yMin && iy1 <= yMax)
                found1 = true;
        }
        if (th2 !== undefined && found1 === false) {
            ix1 = Math.round(x0 + (x1 - x0) * th2);
            iy1 = Math.round(y0 + (y1 - y0) * th2);
            if (ix1 >= xMin && ix1 <= xMax && iy1 >= yMin && iy1 <= yMax)
                found1 = true;
        }
        if (th1 !== undefined && found1 === false) {
            ix1 = Math.round(x0 + (x1 - x0) * th1);
            iy1 = Math.round(y0 + (y1 - y0) * th1);
            if (ix1 >= xMin && ix1 <= xMax && iy1 >= yMin && iy1 <= yMax)
                found1 = true;
        }
    }

    if (found1 === false)
        alert('Failed to find intersection for initial point');

    if (found1 && found2) {
        // now, build the array of latlngs for the shaded area
        shadow.push([y0, x0]); // always start with the scale-to-point
        shadow.push([iy2, ix2]); // next, the point determined by the terminal vertex
        while (iy1 !== iy2 && ix1 !== ix2) {
            // if y1==y2 or x1==x2, we are on the same side as the last point
            if (iy2 === yMin && ix2 !== xMin) ix2 = xMin;
            else if (iy2 === yMax && ix2 !== xMax) ix2 = xMax;
            else if (ix2 === xMax) iy2 = yMin;
            else if (ix2 === xMin) iy2 = yMax;

            shadow.push([iy2, ix2]); // push this point
        }
        shadow.push([iy1, ix1]); // ... the point determined by the starting vertex
        shadow.push([y0, x0]); // and end with the starting point

        return shadow;
        // shadowLayer = L.polygon(shadow, options).addTo(scaleMap);
    }
}
