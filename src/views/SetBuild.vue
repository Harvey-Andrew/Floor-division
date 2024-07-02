<!--
 * @FilePath     : /Floor division/src/views/SetBuild.vue
 * @Description  : 创建楼房
 * @Author       : Harvey-Andrew
 * @Version      : 0.0.1
 * @LastEditors  : Harvey-Andrew 
 * @LastEditTime : 2024-07-02 10:43:29
 * Copyright © 2024 by Harvey-Andrew.
-->

<template>
  <el-card class="setbuild">
    <template #header>
      <div class="card-header">
        <span style="font-weight: 600; font-size: 18px">楼房分户</span>
        <span @click="reset" class="reset">
          <Refresh style="width: 25px; float: right; cursor: pointer" />
        </span>
      </div>
    </template>
    <div>
      <el-steps finish-status="success" :active="data.active" align-center>
        <el-step title="区域绘制" />
        <el-step title="户型切分" />
        <el-step title="楼房分层" />
      </el-steps>
      <div class="my-7 mx-2.5">
        <div class="h-10">
          <span>绘制户型：</span>
          <span class="myIcon" v-show="data.active == 0" @click="drawPolygon">
            <FullScreen />
            <span v-if="isDrawing">绘制图形</span>
            <span v-else>重新绘制</span>
          </span>
          <span class="myIcon" v-show="data.active == 1" @click="drawLine">
            <Scissor />
            <span v-if="isCut">裁切图形</span>
            <span v-else>重新裁切</span>
          </span>
          <span class="myIcon" v-show="data.active == 2" @click="drawPoint">
            <Histogram />
            <span v-if="isClass">楼层分层</span>
            <span v-else>重新分层</span>
          </span>
          <span v-show="data.heightArr.length == 3" class="buildnum">
            楼层数：<el-input v-model="data.floorNum" type="number" />
          </span>
        </div>
        <div class="textInput">
          <el-input v-model="inputArr[0]" />
          <el-input v-model="inputArr[1]" />
          <el-input style="width: 40%" v-model="inputArr[2]" />
          <el-input
            v-show="data.active == 1"
            style="width: 40%"
            v-model="inputArr[3]"
          />
        </div>
        <div
          class="textInput"
          v-for="(item, index) in data.unitArr"
          :key="index"
        >
          <el-input v-model="item[0]" disabled />
          <el-input v-model="data.buildName" />
          <el-input style="width: 40%" v-model="item[1]" />
          <img
            @click="toFlash(item[2])"
            v-show="data.active == 1"
            src="/src/assets/img/position.png"
          />
        </div>
        <div v-show="data.heightArr.length == 3" class="pointList">
          最低点：<el-input v-model="data.heightArr[0]"></el-input>
          分割点：<el-input v-model="data.heightArr[1]"></el-input>
          最高点：<el-input v-model="data.heightArr[2]"></el-input>
        </div>
        <button
          @click="toSetInfo"
          class="float-left mt-2 other-btn"
          type="success"
        >
          查看信息
        </button>
        <button
          class="float-right btn btn--stripe m-3"
          v-if="data.active < 2"
          @click="next"
        >
          下一步
        </button>
        <button
          type="success"
          v-else
          @click="toLayer"
          class="m-3 float-right other-btn"
        >
          楼层分层
        </button>
        <button
          @click="toAddHouse"
          class="other-btn2"
          v-show="data.active == 3"
          style="margin: 12px; float: right"
        >
          生成数据
        </button>
      </div>
    </div>
  </el-card>
</template>
<script setup>
import * as Cesium from "cesium";
import { reactive, getCurrentInstance, ref, onUnmounted } from "vue";
import {
  FullScreen,
  Scissor,
  Histogram,
  Refresh,
} from "@element-plus/icons-vue";
import { toDraw, endDraw } from "@/tool/draw";
import { ElMessage } from "element-plus";
import * as turf from "@turf/turf";
import polygonCut from "@/tool/polygonCut";
import { addHouse } from "../api/houseApi";
import { useRouter } from "vue-router";

const { appContext } = getCurrentInstance();
const global = appContext.config.globalProperties;

const inputArr = ["分户坐标", "地址前缀", "单位", "定位"];
const data = reactive({
  active: 0,
  unitArr: [],
  buildName: "xx小区xx栋",
  heightArr: [],
  floorNum: 0,
});
let polygonEntity,
  polygonGeojson,
  houseList = [],
  polygonCollection;
const next = () => {
  if (data.active == 0 && !polygonEntity) {
    ElMessage.info("请先绘制区域");
    return;
  } else if (data.active == 1) {
    endDraw();
  }
  data.active++;
};
const isDrawing = ref(true);
const isCut = ref(true);
const isClass = ref(true);

// 重置按钮
const reset = () => {
  endDraw();
  global.$viewer.entities.removeAll();
  houseList.length &&
    houseList.forEach((item) => {
      global.$viewer.scene.primitives.remove(item);
    });
  houseList = [];
  data.active = 0;
  data.unitArr = [];
  data.buildName = "xx小区xx栋";
  data.heightArr = [];
  data.floorNum = 0;
  polygonEntity = null;
  polygonGeojson = null;
  polygonCollection = null;
  isCut.value = true;
  isDrawing.value = true;
  isClass.value = true;
};

// 楼层分层
const toLayer = () => {
  if (!data.floorNum) {
    ElMessage.info("请输入楼层数");
    return;
  }

  global.$viewer.entities.removeAll();
  let itemHeight =
    (data.heightArr[2] - data.heightArr[1]) / (data.floorNum - 1);
  houseList.length &&
    houseList.forEach((item) => {
      global.$viewer.scene.primitives.remove(item);
    });
  houseList = [];

  data.unitArr.forEach((item) => {
    for (let i = 0; i < data.floorNum; i++) {
      let height, extrudedHeight;
      if (i == 0) {
        height = +data.heightArr[0];
        extrudedHeight = +data.heightArr[1];
      } else {
        height = +data.heightArr[1] + itemHeight * (i - 1);
        extrudedHeight = +data.heightArr[1] + itemHeight * i;
      }
      let primitive = new Cesium.ClassificationPrimitive({
        geometryInstances: new Cesium.GeometryInstance({
          geometry: new Cesium.PolygonGeometry({
            polygonHierarchy: new Cesium.PolygonHierarchy(
              item[2].polygon.hierarchy._value.positions
            ),
            height,
            extrudedHeight,
          }),
          attributes: {
            color: Cesium.ColorGeometryInstanceAttribute.fromColor(
              Cesium.Color.fromRandom({ alpha: 0.3 }) //颜色
            ),
          },
        }),
        classificationType: Cesium.ClassificationType.CESIUM_3D_TILE,
      });
      global.$viewer.scene.primitives.add(primitive);
      houseList.push(primitive);
    }
  });

  if (houseList.length > 0) {
    data.active = 3;
  }
};

// 画点
const drawPoint = () => {
  isClass.value = false;
  ElMessage.info("请绘制底层，二楼以及顶楼高度点");
  data.heightArr = [];
  // 倒删可以避免漏删的情况
  for (let i = global.$viewer.entities.values.length - 1; i >= 0; i--) {
    let item = global.$viewer.entities.values[i];
    item.point && global.$viewer.entities.remove(item);
  }

  // 顺序删除会漏删
  // global.$viewer.entities.values.forEach((item) => {
  //   item.point && global.$viewer.entities.remove(item);
  // });

  toDraw(global.$viewer, "point", (res) => {
    // console.log(res.position._value);
    // 收集高度
    let height = Cesium.Cartographic.fromCartesian(res.position._value).height;
    // console.log(height);
    data.heightArr.push(height);
    // 收集到三个点后，结束绘制
    if (data.heightArr.length == 3) {
      data.heightArr.sort((a, b) => a - b);
      ElMessage.success("绘制成功！");
      endDraw();
    }
  });
};

// 线型绘制
const drawLine = () => {
  isCut.value = false;
  ElMessage.info("请绘制图形，右键结束绘制");
  global.$viewer.entities.removeAll();
  global.$viewer.entities.add(polygonEntity);
  data.unitArr = [
    [polygonGeojson.geometry.coordinates.toString(), 1, polygonEntity],
  ];
  toDraw(global.$viewer, "line", (res) => {
    // console.log(res.polyline.positions._value);
    // 获得笛卡尔坐标
    global.$viewer.entities.remove(res);
    let car3_ps = res.polyline.positions._value;
    let arr = [];
    // 笛卡尔坐标转经纬度坐标
    for (let i = 0; i < car3_ps.length; i++) {
      let _cartographic = Cesium.Cartographic.fromCartesian(car3_ps[i]);
      let _lat = Cesium.Math.toDegrees(_cartographic.latitude);
      let _lng = Cesium.Math.toDegrees(_cartographic.longitude);
      arr.push([_lng, _lat]);
    }
    // console.log(arr);
    // 使用turf库转为geojson 注意首尾坐标一致 输入的也要是三维数组
    var lineGeojson = turf.lineString(arr);
    // console.log(lineGeojson);
    // 捕获错误
    try {
      polygonCollection = polygonCut(polygonGeojson, lineGeojson);
      if (polygonCollection.features.length == 1) {
        ElMessage.error("请切割区域！");
        return;
      }
    } catch (error) {
      ElMessage.error(error);
      return;
    }
    // console.log(polygonCollection);
    // 加载裁切后的geojson数据
    Cesium.GeoJsonDataSource.load(polygonCollection, {
      clampToGround: true,
    }).then((info) => {
      // console.log(info);

      // 清空原有的实体
      global.$viewer.entities.removeAll();
      data.unitArr = [];

      info.entities.values.forEach((item, index) => {
        // console.log(item);
        item.polygon.material = Cesium.Color.fromRandom({ alpha: 0.5 });
        global.$viewer.entities.add(item);
        // 往数组推元素
        data.unitArr.push([
          polygonCollection.features[index].geometry.coordinates.toString(),
          data.unitArr.length + 1,
          item,
        ]);
      });
    });
  });
};

// 面形绘制
const drawPolygon = () => {
  ElMessage.info("请绘制图形，右键结束绘制");
  global.$viewer.entities.removeAll();
  data.unitArr = [];
  polygonEntity = null;
  isDrawing.value = false;
  toDraw(global.$viewer, "polygon", (res) => {
    polygonEntity = res;
    // console.log(res.polygon.hierarchy._value.positions);
    // 获得笛卡尔坐标
    let car3_ps = res.polygon.hierarchy._value.positions;
    let arr = [];
    // 笛卡尔坐标转经纬度坐标
    for (let i = 0; i < car3_ps.length; i++) {
      let _cartographic = Cesium.Cartographic.fromCartesian(car3_ps[i]);
      let _lat = Cesium.Math.toDegrees(_cartographic.latitude);
      let _lng = Cesium.Math.toDegrees(_cartographic.longitude);
      arr.push([_lng, _lat]);
    }
    // console.log(arr);
    // 使用turf库转为geojson 注意首尾坐标一致 输入的也要是三维数组
    arr.push(arr[0]);
    polygonGeojson = turf.polygon([arr]);
    // console.log(polygonGeojson);
    data.unitArr.push([polygonGeojson.geometry.coordinates.toString(), 1, res]);

    // 对比包裹前后的楼房分层情况
    // res.polygon.height = 20;
    // res.polygon.extrudedHeight = 40;

    // let primitive = new Cesium.ClassificationPrimitive({
    //   geometryInstances: new Cesium.GeometryInstance({
    //     geometry: new Cesium.PolygonGeometry({
    //       polygonHierarchy: new Cesium.PolygonHierarchy(car3_ps),
    //       height: 45,
    //       extrudedHeight: 70,
    //     }),
    //     attributes: {
    //       color: Cesium.ColorGeometryInstanceAttribute.fromColor(
    //         Cesium.Color.fromRandom({ alpha: 0.3 }) //颜色
    //       ),
    //     },
    //   }),
    //   classificationType: Cesium.ClassificationType.CESIUM_3D_TILE,
    // });
    // global.$viewer.scene.primitives.add(primitive);
  });
};
// 闪烁
const toFlash = (entity) => {
  if (!entity.polygon.material.color._value) return;
  // console.log(entity);
  // 获得最初的颜色
  let initColor = entity.polygon.material.color._value;
  let x = 1;
  let flog = true;
  entity.polygon.material = new Cesium.ColorMaterialProperty(
    new Cesium.CallbackProperty(() => {
      if (flog) {
        x = x - 0.05;
        if (x <= 0) {
          flog = false;
        }
      } else {
        x = x + 0.05;
        if (x >= 1) {
          flog = true;
        }
      }
      return Cesium.Color.RED.withAlpha(x);
    }, false)
  );
  // 定时器 关闭闪烁 也就是将实体原来的颜色重新赋值
  setTimeout(() => {
    entity.polygon.material = initColor;
  }, 1500);
};

// 提交数据到数据库
const $router = useRouter();
const toAddHouse = () => {
  let polygonJson = JSON.stringify(polygonGeojson.geometry);
  let polygonJsonArr = polygonCollection
    ? polygonCollection.features.map((item) => {
        return JSON.stringify(item.geometry);
      })
    : [];
  let unitArr = data.unitArr.map((item) => {
    return Number(item[1]);
  });
  let heightArr = data.heightArr.map((item) => {
    return Number(item);
  });
  addHouse({
    polygonJsonArr,
    polygonJson,
    unitArr,
    heightArr,
    name: data.buildName,
    floorNum: Number(data.floorNum),
  }).then((res) => {
    if (res.code == 200) {
      ElMessage.success("提交成功");
      console.log(res);
      reset();
      $router.push("/setInfo");
    }
  });
};

const toSetInfo = () => {
  $router.push("/setInfo");
};
// 销毁释放资源 不会影响其他组件
onUnmounted(() => {
  reset();
});
</script>
<style lang="scss">
.setbuild {
  width: 32%;
  position: absolute;
  top: 4%;
  left: 4%;
  z-index: 999;
  border-radius: 10px;
  background-image: linear-gradient(120deg, #e0c3fc 0%, #8ec5fc 100%);

  .buildnum {
    float: right;
    width: 34%;

    .el-input {
      width: 50%;
    }
  }

  .myIcon {
    cursor: pointer;

    svg {
      width: 20px;
      position: relative;
      top: 5px;
      margin-right: 3px;
    }
  }

  .textInput {
    display: flex;

    .el-input {
      margin: 5px 1%;

      .el-input__inner {
        text-align: center;
      }
    }

    img {
      margin: 10px 4.6%;
      width: 14%;
      height: 25px;
      cursor: pointer;
    }
  }

  .pointList {
    display: flex;
    font-size: 15px;
    margin: 20px 0;
    line-height: 30px;

    .el-input {
      width: 15%;
      margin-right: 4%;
    }
  }
}
.el-step__title.is-wait {
  color: #666;
}
.el-card {
  border: none;
}
$color-gray: #666;
$color-black: #000;
$stripe-height: 7px;
$btn-color: $color-gray;
$btn-background: #fff;
$btn-color-hover: #fff;
$btn-background-hover: $color-gray;
$border-color: $color-gray;
$border-color-hover: $color-black;

@mixin reset-button {
  overflow: visible;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  font: inherit;
  line-height: normal;
  cursor: pointer;
  -moz-user-select: text;

  &:-moz-focus-inner {
    padding: 0;
    border: 0;
  }
}

@keyframes stripe-slide {
  0% {
    background-position: 0% 0;
  }
  100% {
    background-position: 100% 0;
  }
}

.btn {
  @include reset-button;
  display: block;
  text-decoration: none;
  text-transform: uppercase;
  padding: 4px 6px;
  background-color: $btn-background;
  color: $btn-color;
  border: 2px solid $border-color;
  border-radius: 6px;
  margin: 13px 0;
  transition: all 0.5s ease;
  font-size: 12px;

  &--stripe {
    overflow: hidden;
    position: relative;

    &:hover {
      background-color: $btn-background-hover;
      color: $btn-color-hover;
      border-color: $border-color-hover;

      &:after {
        background-image: repeating-linear-gradient(
          45deg,
          $btn-color-hover,
          $btn-color-hover 1px,
          transparent 2px,
          transparent 5px
        );
        border-top: 1px solid $border-color-hover;
        animation: stripe-slide 12s infinite linear forwards;
      }
    }
  }
}

$color: #2194e0;
$color2: #66df75;

@keyframes sheen {
  0% {
    transform: skewY(-45deg) translateX(0);
  }
  100% {
    transform: skewY(-45deg) translateX(12.5em);
  }
}

.other-btn2 {
  padding: 0.2em 0.5em;
  text-align: center;
  text-decoration: none;
  color: $color2;
  border: 2px solid $color2;
  display: inline-block;
  border-radius: 0.3em;
  transition: all 0.2s ease-in-out;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  &:before {
    content: "";
    background-color: rgba(255, 255, 255, 0.5);
    height: 100%;
    width: 3em;
    display: block;
    position: absolute;
    top: 0;
    left: -4.5em;
    transform: skewX(-45deg) translateX(0);
    transition: none;
  }
  &:hover {
    background-color: $color2;
    color: #fff;
    border-bottom: 4px solid darken($color2, 10%);
    &:before {
      transform: skewX(-45deg) translateX(13.5em);
      transition: all 0.5s ease-in-out;
    }
  }
}
.other-btn {
  padding: 0.2em 0.5em;
  text-align: center;
  text-decoration: none;
  color: $color;
  border: 2px solid $color;
  display: inline-block;
  border-radius: 0.3em;
  transition: all 0.2s ease-in-out;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  &:before {
    content: "";
    background-color: rgba(255, 255, 255, 0.5);
    height: 100%;
    width: 3em;
    display: block;
    position: absolute;
    top: 0;
    left: -4.5em;
    transform: skewX(-45deg) translateX(0);
    transition: none;
  }
  &:hover {
    background-color: $color;
    color: #fff;
    border-bottom: 4px solid darken($color, 10%);
    &:before {
      transform: skewX(-45deg) translateX(13.5em);
      transition: all 0.5s ease-in-out;
    }
  }
}
.reset:hover {
  color: #2194e0;
}
</style>
