<template>
  <el-card class="house">
    <template #header>
      <div class="card-header">
        <span style="font-weight: 600; font-size: 18px">查看房户信息</span>
        <span class="ml-10"></span>
        <el-select
          v-model="data.pickBuild"
          placeholder="请选择楼栋"
          class="float-right w-40"
          @change="changBuild"
        >
          <el-option
            v-for="item in data.buildArr"
            :key="item.id"
            :label="item.name"
            :value="item"
          />
        </el-select>
      </div>
    </template>
    <button
      @click="toSetBuild"
      class="float-right mb-5 other-btn"
      type="success"
    >
      返回楼房分户
    </button>
  </el-card>
</template>
<script setup>
import * as Cesium from "cesium";
import { reactive, getCurrentInstance, onMounted, onUnmounted } from "vue";
import * as turf from "@turf/turf";
import { getBuild } from "../api/buildApi";
import { getHouse, getOneHouseInfo } from "@/api/houseApi";
import Bubble from "../tool/bubble";
import { useRouter } from "vue-router";

const { appContext } = getCurrentInstance();
const global = appContext.config.globalProperties;
const data = reactive({
  buildArr: [],
  pickBuild: null,
  query: {
    noPage: 1,
  },
  tableData: [],
  total: 0,
});
const $router = useRouter();
const toSetBuild = () => {
  $router.push("/setBuild");
};
const colors = [
  "#99CCCC",
  "#66FF66",
  "#FF6666",
  "#00CCFF",
  "#00FF33",
  "#CC0000",
  "#CC00CC",
  "#CCFF00",
  "#0000FF",
];
onMounted(() => {
  initData();
  initHandler();
});

// 点击事件
let bubble, lastPick, pick;
const initHandler = () => {
  // console.log(global.$viewer);

  // 鼠标点击事件
  let handler = new Cesium.ScreenSpaceEventHandler(global.$viewer.scene.canvas);
  handler.setInputAction((event) => {
    pick = global.$viewer.scene.pick(event.position);
    // console.log(pick);
    let position = global.$viewer.scene.pickPosition(event.position);
    // console.log(pick.primitive.getGeometryInstanceAttributes(pick.id));
    if (position && pick && pick.id) {
      if (lastPick && lastPick.id != pick.id) {
        const lastAttributes = lastPick.primitive.getGeometryInstanceAttributes(
          lastPick.id
        );
        lastAttributes.color = Cesium.ColorGeometryInstanceAttribute.toValue(
          Cesium.Color.fromCssColorString(colors[pick.id % 9]).withAlpha(0.3) //颜色
        );
      }
      const attributes = pick.primitive.getGeometryInstanceAttributes(pick.id);
      console.log(attributes);
      attributes.color = Cesium.ColorGeometryInstanceAttribute.toValue(
        Cesium.Color.YELLOW.withAlpha(0.88)
      );
      lastPick = pick;
      getOneHouseInfo({ id: pick.id }).then((res) => {
        if (res.code == 200) {
          // console.log(res);
          let houseInfo = res.data;
          //注意删除之前的对话框
          bubble && bubble.windowClose();
          bubble = new Bubble({
            position,
            viewer: global.$viewer,
            houseInfo,
          });
        }
      });
    }

    // console.log(pick);
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
};

// 初始化数据
const initData = () => {
  getBuild().then((res) => {
    if (res.code == 200) {
      // console.log(res);
      data.buildArr = res.data;
      // console.log(data.buildArr);
    }
  });
};
// 视角切换
// 可以在楼层分割时做一个视角切换的点 就不用寻找中心点了
const changBuild = (item) => {
  data.pickBuild = item.name;
  const center = turf.center(item.polygon);
  // console.log(center);
  global.$viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(
      ...center.geometry.coordinates,
      200
    ),
  });
  data.query.id = item.id;

  getHouseData();
};

// 获得楼房的数据
let primitiveArr = [];
const getHouseData = () => {
  getHouse(data.query).then((res) => {
    // console.log(res);
    if (res.code == 200) {
      primitiveArr.length &&
        primitiveArr.forEach((a) => {
          a.show = false;
        });

      primitiveArr = [];
      bubble && bubble.windowClose();

      res.data.forEach((item) => {
        let arr = item.polygon.coordinates[0].flat();
        let primitive = new Cesium.ClassificationPrimitive({
          geometryInstances: new Cesium.GeometryInstance({
            id: item.id,
            geometry: new Cesium.PolygonGeometry({
              polygonHierarchy: new Cesium.PolygonHierarchy(
                Cesium.Cartesian3.fromDegreesArray(arr)
              ),
              height: item.minHeight,
              extrudedHeight: item.maxHeight,
            }),
            attributes: {
              color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                Cesium.Color.fromCssColorString(colors[item.id % 9]).withAlpha(
                  0.3
                ) //颜色
              ),
            },
          }),
          classificationType: Cesium.ClassificationType.CESIUM_3D_TILE,
        });
        global.$viewer.scene.primitives.add(primitive);
        primitiveArr.push(primitive);
      });
    }
  });
};

const reset = () => {
  primitiveArr.length &&
    primitiveArr.forEach((item) => {
      global.$viewer.scene.primitives.remove(item);
    });
  primitiveArr = [];
  bubble && bubble.windowClose();
};
onUnmounted(() => {
  reset();
});
</script>
<style lang="scss">
.house {
  width: 32%;
  position: absolute;
  top: 4%;
  left: 4%;
  z-index: 999;
  background-image: linear-gradient(120deg, #e0c3fc 0%, #8ec5fc 100%);
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

@keyframes sheen {
  0% {
    transform: skewY(-45deg) translateX(0);
  }
  100% {
    transform: skewY(-45deg) translateX(12.5em);
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
.el-card {
  border: none;
}
</style>
