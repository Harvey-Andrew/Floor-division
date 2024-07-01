import * as Cesium from "cesium";

// 加载3dtiles
function load3dtiles(viewer, url, success) {
  if (!url) {
    alert("缺少模型地址");
    return;
  }
  let tp = viewer.scene.primitives.add(
    new Cesium.Cesium3DTileset({
      maximumScreenSpaceError: 30,
      url: url,
    })
  );
  tp.readyPromise.then(function (tileset) {
    if (success) success(tileset);
  });
}

// 修改3dtiles位置
const tx = 0;
const ty = 0;
const tz = -69;
const rx = 0;
const ry = 0;
const rz = 0;
const scale = 1.3;
function update3dtiles(tileSet) {
  const cartographic = Cesium.Cartographic.fromCartesian(
    tileSet.boundingSphere.center
  );
  const surface = Cesium.Cartesian3.fromRadians(
    cartographic.longitude,
    cartographic.latitude,
    cartographic.height
  );
  const m = Cesium.Transforms.eastNorthUpToFixedFrame(surface);

  //平移
  const _tx = tx ? tx : 0;
  const _ty = ty ? ty : 0;
  const _tz = tz ? tz : 0;
  const tempTranslation = new Cesium.Cartesian3(_tx, _ty, _tz);
  const offset = Cesium.Matrix4.multiplyByPoint(
    m,
    tempTranslation,
    new Cesium.Cartesian3(0, 0, 0)
  );
  const translation = Cesium.Cartesian3.subtract(
    offset,
    surface,
    new Cesium.Cartesian3()
  );
  tileSet.modelMatrix = Cesium.Matrix4.fromTranslation(translation);

  //旋转及缩放
  if (rx) {
    const mx = Cesium.Matrix3.fromRotationX(Cesium.Math.toRadians(rx));
    const rotate = Cesium.Matrix4.fromRotationTranslation(mx);
    Cesium.Matrix4.multiply(m, rotate, m);
  }

  if (ry) {
    const my = Cesium.Matrix3.fromRotationY(Cesium.Math.toRadians(ry));
    const rotate = Cesium.Matrix4.fromRotationTranslation(my);
    Cesium.Matrix4.multiply(m, rotate, m);
  }

  if (rz) {
    const mz = Cesium.Matrix3.fromRotationZ(Cesium.Math.toRadians(rz));
    const rotate = Cesium.Matrix4.fromRotationTranslation(mz);
    Cesium.Matrix4.multiply(m, rotate, m);
  }

  if (scale) {
    const _scale = Cesium.Matrix4.fromUniformScale(scale);
    Cesium.Matrix4.multiply(m, _scale, m);
  }

  tileSet._root.transform = m;
}

export { load3dtiles, update3dtiles };
