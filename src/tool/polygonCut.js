/**
 * @FilePath     : /Floor division/src/tool/polygonCut.js
 * @Description  : 切割多边形
 * @Author       : Harvey-Andrew
 * @Version      : 0.0.1
 * @LastEditors  : Harvey-Andrew 
 * @LastEditTime : 2024-07-01 23:06:43
 * @Copyright © 2024 by Harvey-Andrew.
 */

import * as turf from "@turf/turf";
function polygonCut(
    poly,
    line,
    tolerance = 0.0002,
    toleranceType = "kilometers"
) {
    // 1. 条件判断
    if (poly.geometry === void 0 || poly.geometry.type !== "Polygon")
        throw "传入的必须为polygon";
    if (
        line.geometry === void 0 ||
        line.geometry.type.toLowerCase().indexOf("linestring") === -1
    )
        throw "传入的必须为linestring";
    if (line.geometry.type === "LineString") {
        if (
            turf.booleanPointInPolygon(
                turf.point(line.geometry.coordinates[0]),
                poly
            ) ||
            turf.booleanPointInPolygon(
                turf.point(
                    line.geometry.coordinates[line.geometry.coordinates.length - 1]
                ),
                poly
            )
        )
            throw "起点和终点必须在多边形之外";
    }
    // 2. 计算交点，并把线的点合并
    let lineIntersect = turf.lineIntersect(line, poly);
    const lineExp = turf.explode(line);
    for (let i = 0; i < lineExp.features.length - 1; i++) {
        lineIntersect.features.push(
            turf.point(lineExp.features[i].geometry.coordinates)
        );
    }
    // 3. 计算线的缓冲区
    const lineBuffer = turf.buffer(line, tolerance, {
        units: toleranceType,
    });
    // 4. 计算线缓冲和多边形的difference，返回"MultiPolygon"，所以将其拆开
    const _body = turf.difference(poly, lineBuffer);
    let pieces = [];
    if (_body.geometry.type === "Polygon") {
        pieces.push(turf.polygon(_body.geometry.coordinates));
    } else {
        _body.geometry.coordinates.forEach(function (a) {
            pieces.push(turf.polygon(a));
        });
    }
    // 5. 处理点数据
    for (let p in pieces) {
        const piece = pieces[p];
        for (let c in piece.geometry.coordinates[0]) {
            const coord = piece.geometry.coordinates[0][c];
            const p = turf.point(coord);
            for (let lp in lineIntersect.features) {
                const lpoint = lineIntersect.features[lp];
                if (turf.distance(lpoint, p, toleranceType) <= tolerance * 2) {
                    piece.geometry.coordinates[0][c] = lpoint.geometry.coordinates;
                }
            }
        }
    }
    // 6. 过滤掉重复点
    // for (let p in pieces) {
    //   const coords = pieces[p].geometry.coordinates[0];
    //   pieces[p].geometry.coordinates[0] = filterDuplicatePoints(coords);
    // }
    // 7. 将属性赋予每一个polygon，并处理id
    pieces.forEach((a, index) => {
        a.properties = Object.assign({}, poly.properties);
        a.properties.id += `-${index}`;
    });
    return turf.featureCollection(pieces);
}

export default polygonCut