import * as Cesium from "cesium";
let viewer
//方式
let drawingMode
//绘制好的实体
let myDraw


// 点坐标列表
let activeShapePoints = [];
// 正在绘制的实体
let activeShape;
// 浮动点
let floatingPoint;
//事件
let handler
//左键点击确定的点列表实体
let pointArr = []

// 创建点
function createPoint(worldPosition) {
    let point = viewer.entities.add({
        position: worldPosition,
        point: {
            color: Cesium.Color.RED,
            // 大小
            pixelSize: 10,
            heightReference: Cesium.HeightReference.NONE,
        },
    });
    return point;
}


function drawShape(positionData) {
    let shape;
    if (drawingMode === "line") {
        shape = viewer.entities.add({
            // 线段
            polyline: {
                positions: positionData,
                clampToGround: true,
                width: 3,
                material: new Cesium.ColorMaterialProperty(
                    Cesium.Color.YELLOW.withAlpha(0.7)
                ),
            },
        });
    } else if (drawingMode === "polygon") {
        // 多边形
        shape = viewer.entities.add({
            polygon: {
                hierarchy: positionData,
                material: new Cesium.ColorMaterialProperty(
                    Cesium.Color.WHITE.withAlpha(0.7)
                ),
            },
        });
    }
    return shape;
}

// 重新绘制形状，使其不是动态的，然后删除动态形状.
function terminateShape() {
    // 删除最后一个点
    activeShapePoints.pop();
    // 绘制完整的图形
    myDraw = drawShape(activeShapePoints);
    endDraw()
}


function toDraw(Gviewer, GdrawingMode = "polygon", call) {
    if (handler) {
        endDraw()
    }
    drawingMode = GdrawingMode
    viewer = Gviewer
    // 创建浮动点
    floatingPoint = createPoint(Cesium.Cartesian3.fromDegrees(0, 0));
    if (drawingMode == 'point') {
        // 创建鼠标事件
        handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
        handler.setInputAction((event) => {
            let earthPosition = viewer.scene.pickPosition(event.position);
            if (Cesium.defined(earthPosition)) {
                call(Gviewer.entities.add({
                    position: earthPosition,
                    point: {
                        color: Cesium.Color.BLUE,
                        pixelSize: 10,
                        heightReference: Cesium.HeightReference.NONE,
                    },
                }))
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
    } else {
        // 创建鼠标事件
        handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
        handler.setInputAction((event) => {
            // 获取鼠标当前位置 viewer.scene.pickPosition 将位置转化为笛卡尔单位
            let earthPosition = viewer.scene.pickPosition(event.position);
            if (Cesium.defined(earthPosition)) {
                if (activeShapePoints.length === 0) {
                    activeShapePoints.push(earthPosition);
                    // 最重要的一步，绘制过程中图形会动态跟着鼠标移动
                    // CallbackProperty返回一个回调函数 当activeShapePoints改变时会触发
                    // 不管activeShapePoints是增加还是删除都会动态改变图形的形状
                    // 在绘制结束必须重置activeShapePoints = [] 不然 CallbackProperty 一直处于回调中，严重消耗性能
                    let dynamicPositions = new Cesium.CallbackProperty(() => {
                        if (drawingMode === "polygon") {
                            // 多边形的position需要用 PolygonHierarchy进行转化
                            return new Cesium.PolygonHierarchy(activeShapePoints);
                        }
                        return activeShapePoints;
                    }, false);
                    activeShape = drawShape(dynamicPositions);
                }
                activeShapePoints.push(earthPosition);
                pointArr.push(createPoint(earthPosition))
            }
            // 鼠标左键点击事件 LEFT_CLICK
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        // 结束绘制
        handler.setInputAction(() => {
            terminateShape();
            // 鼠标右键点击事件 RIGHT_CLICK
            call(myDraw)
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    }
    handler.setInputAction((event) => {
        let newPosition = viewer.scene.pickPosition(event.endPosition);
        if (Cesium.defined(newPosition)) {
            floatingPoint.position.setValue(newPosition);
            // 判断是否在绘制线或者面
            if (drawingMode != 'point' && activeShapePoints.length>0) {
                // 动态改变活动点的位置与鼠标当前位置保持一致
                activeShapePoints.pop();
                activeShapePoints.push(newPosition);
            }
        }
        // 鼠标左键移动事件 MOUSE_MOVE
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
}

function endDraw() {
    if (handler) {
        pointArr.length && pointArr.forEach(item => {
            viewer.entities.remove(item);
        })
        // 删除创建的浮动点和处于活动状态的实体
        floatingPoint && viewer.entities.remove(floatingPoint);
        activeShape && viewer.entities.remove(activeShape);
        // 格式化
        floatingPoint = null;
        activeShape = null;
        activeShapePoints = [];
        pointArr = []
        handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK)//移除左键点击事件
        handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE)//移除鼠标移动事件
        handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK)//移除右键点击事件
        handler = null
    }
}

export { toDraw, endDraw }

