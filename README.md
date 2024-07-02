个人博客：https://douglas.blog.csdn.net
这是一个涉及Cesium.js（一个用于Web的3D地球和地图的JavaScript库）和前后端交互的楼房分户案例。该案例的主要功能包括区域绘制、户型切分、楼房分层、编辑房户信息和查看房户信息等等。
# 1. 地图初始化

加载 3D 瓦片到地图上。

![image-20240701194950727](https://gitee.com/dongxiaogit/image2/raw/master/image/image-20240701194950727.png)

需要将地图变为全局变量，其他组件也可以使用。

```js
const { appContext } = getCurrentInstance();
const global = appContext.config.globalProperties;
//别的组件也能使用
global.$viewer = viewer;
```

实现代码

```vue
<template>
  <div id="cesiumContainer"></div>
  <router-view></router-view>
</template>
<script setup>
import * as Cesium from "cesium";
import { onMounted, getCurrentInstance } from "vue";
import { load3dtiles, update3dtiles } from "./tool/load3D";
const { appContext } = getCurrentInstance();
const global = appContext.config.globalProperties;
let viewer;
Cesium.Ion.defaultAccessToken = "your token";

onMounted(() => {
  // viewer是操控地图api的开始
  viewer = new Cesium.Viewer("cesiumContainer", {
    selectionIndicator: false, //隐藏选中框
    infoBox: false, //隐藏右上角信息框
    timeline: false,
    animation: false,
  });
  load3dtiles(viewer, "/src/assets/b3dm/tileset.json", (tileset) => {
    global.$viewer = viewer;
    // 贴地
    update3dtiles(tileset);
    viewer.zoomTo(tileset);
  });
});
</script>
<style scoped>
#cesiumContainer {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>
```

# 2. 区域绘制

## 2.1. 步骤条

完成一个任务就跳转到下一个任务，从第一个开始到最后一个，也就是 data.active 自增。

```js
      <el-steps finish-status="success" :active="data.active" align-center>
        <el-step title="区域绘制" />
        <el-step title="户型切分" />
        <el-step title="楼房分层" />
      </el-steps>
```

最后一个就是楼房分层，而不是下一步。

```vue
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
```

如果没完成上一步的步骤，就不能跳转，弹出提示框。

```js
const next = () => {
  if (data.active == 0 && !polygonEntity) {
    ElMessage.info("请先绘制区域");
    return;
    //跳到楼房分层后，画笔都清空
  } else if (data.active == 1) {
    endDraw();
  }
  data.active++;
};
```

## 2.2. 画笔绘制

使用封装好的画笔工具进行绘制，传入多边形，回调返回画好的多边形。

```js
toDraw(global.$viewer, "polygon", (res) => {
	console.log(res)
}
```

将画好的多边形以经纬度返回到页面，也就是要笛卡尔坐标转经纬度

```js
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
```

使用 turf 库转为 geojson，注意至少画四个点，首尾坐标一致，输入的也要是三维数组。

```js
arr.push(arr[0]);
polygonGeojson = turf.polygon([arr]);
console.log(polygonGeojson);
```

> bug：
>
> 1. 不够四个点以上会报错误：Error: Each LinearRing of a Polygon must have 4 or more Positions.
>
> 2. 首尾不连接会报错误：Error: First and last Position are not equivalent.

## 2.3. 渲染页面

将分户坐标、地址前缀、单位放到一个数组中，遍历循环渲染到页面中。

```js
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
```

![image-20240701205446247](https://gitee.com/dongxiaogit/image2/raw/master/image/image-20240701205446247.png)

## 2.4. 重新绘制

再次点击绘制，删除所有的实体，数据都清空。

```js
global.$viewer.entities.removeAll();
data.unitArr = [];
polygonEntity = null;
```

# 3. 户型切分

## 3.1. 分割多边形

用线去分割面，用封装好的切割函数，传入线和面的 geojson 数据进行切割

```js
polygonCollection = polygonCut(polygonGeojson, lineGeojson);
```

## 3.2. 加载裁切数据

加载裁切后的 geojson 数据，并个切出来后的多边形给一个随机颜色。

```js
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
```

![image-20240701211540593](https://gitee.com/dongxiaogit/image2/raw/master/image/image-20240701211540593.png)

## 3.3. 重新裁切

如果没有裁好，可以在每次点击裁切时，清空原有裁切的结果。

```js
global.$viewer.entities.removeAll();
global.$viewer.entities.add(polygonEntity);
data.unitArr = [
  [polygonGeojson.geometry.coordinates.toString(), 1, polygonEntity],
];
```

## 3.4. 画笔清空

在进入楼房分层后，不管你是否绘制完成，都要消除画笔。

```js
const next = () => {
  if (data.active == 0 && !polygonEntity) {
    ElMessage.info("请先绘制区域");
    return;
    //跳到楼房分层后，画笔都清空
  } else if (data.active == 1) {
    endDraw();
  }
  data.active++;
};
```

## 3.5. 裁切的小细节

### 3.5.1. 第一个 bug 

出现 bug：起点和终点必须在多边形之外，这时起点在外面，终点在里面

使用 try...catch 捕获错误，在画完后，线消失，弹出错误。

```js
// 捕获错误
try {
  polygonCollection = polygonCut(polygonGeojson, lineGeojson);
} catch (error) {
  ElMessage.error(error);
  return;
}
```

画线前消除线

```js
global.$viewer.entities.remove(res);
```

![QQ录屏20240701212930 -original-original](https://gitee.com/dongxiaogit/image2/raw/master/image/QQ录屏20240701212930 -original-original.gif)

### 3.5.2. 第二个 bug 

切割线在面的外面.

![QQ录屏20240701213152 -original-original](https://gitee.com/dongxiaogit/image2/raw/master/image/QQ录屏20240701213152 -original-original.gif)

解决方法

```js
if (polygonCollection.features.length == 1) {
  ElMessage.error("请切割区域！");
  return;
}
```

## 3.6. 楼层闪烁

使用闪烁功能，能够让你知道楼层单位的具体位置。

需要使用定时器，停止闪烁，将实体原来的颜色重新赋值，不然会一直闪烁。

```js
const toFlash = (entity) => {
  //防止连续点击没有获得_value值
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
```

![QQ录屏20240701213952 -original-original](https://gitee.com/dongxiaogit/image2/raw/master/image/QQ录屏20240701213952 -original-original.gif)

参考笔记：[Cesium-entiy 闪烁范例](https://www.cnblogs.com/yaohuimo/p/11186521.html)

# 4. 楼房分层

## 4.1. 绘制点

注意，一楼与其他楼的高度不一样，用最低点、分割点和最高点进行分割。

![image-20240701222146000](https://gitee.com/dongxiaogit/image2/raw/master/image/image-20240701222146000.png)

收集三个点就结束绘制，并收集三个点的高度，需要将点的坐标转为弧度坐标后，才能得到相应的高度。

需要将三个点的高度进行排序，避免起始点从上面画、在中间画等情况，然后展示在页面中。

```js
toDraw(global.$viewer, "point", (res) => {
  // console.log(res.position._value);
  // 收集高度
  let height = Cesium.Cartographic.fromCartesian(res.position._value).height;
  // console.log(height);
  data.heightArr.push(height);
  // 收集到三个点后，结束绘制
  if (data.heightArr.length == 3) {
    //排序
    data.heightArr.sort((a, b) => a - b);
    ElMessage.success("绘制成功！");
    endDraw();
  }
});
```

## 4.2. 重新绘制

相关的点数组清空，将点删干净，不能使用 removeAll，会删除前面的实体！

```js
globa.$viewer.entities.removeAll();
```

解决办法：使用遍历删除点实体

使用 forEach 删除，会发现删除不干净，顺序删除会漏删。

> Cesium 的一个坑，只要是针对`global.$viewer.entities.values`就会漏删，自己声明的就不会

原理图：

当你删除索引 0 的值后，其他值就会往前，比如第一次删除“你”，第二次删除时，”我“跑到了索引 0，而删除索引 1 的是”他“。

![image-20240702092310612](https://gitee.com/dongxiaogit/image2/raw/master/image/image-20240702092310612.png)

假设有 6 个点，当你使用 forEach 删除点实体的时候，会发现索引为奇数的点保留下来，偶数点就被删除。

![QQ录屏20240702092705 -original-original](https://gitee.com/dongxiaogit/image2/raw/master/image/QQ录屏20240702092705 -original-original.gif)

使用倒删的方法，就能解决漏删的情况。

```js
// 倒删可以避免漏删的情况
for (let i = global.$viewer.entities.values.length - 1; i >= 0; i--) {
  let item = global.$viewer.entities.values[i];
  item.point && global.$viewer.entities.remove(item);
}
```

在切分楼层前，需要输入楼层数

拿到一个面，给面一个高度和拉伸高度，把平面变成一个柱体

```js
res.polygon.height = 20;
res.polygon.extrudedHeight = 40;
```

![image-20240702094054942](https://gitee.com/dongxiaogit/image2/raw/master/image/image-20240702094054942.png)

不管你怎么画得再好，沿着边缘画，也不可能刚好包裹楼层，这时需要用到 3D 瓦片包裹的 api

## 4.3. 包裹 3D 瓦片

包裹 3D 瓦片，用来对楼房进行分层。

```js
let primitive = new Cesium.ClassificationPrimitive({
  geometryInstances: new Cesium.GeometryInstance({
    geometry: new Cesium.PolygonGeometry({
      polygonHierarchy: new Cesium.PolygonHierarchy(
        Cesium.Cartesian3.fromDegreesArray(坐标数组)
      ),
      height: 单体最低处与地面的高度,
      extrudedHeight: 单体最高处与地面高度,
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
```

> 它不是一个 primitive，而是类名的东西。

对比包裹前和后区别

![image-20240702094615182](https://gitee.com/dongxiaogit/image2/raw/master/image/image-20240702094615182.png)

## 4.4. 分层

防止 CPU 过载，先说特殊的情况：一栋楼只有一个单位

假设一个栋楼有三个单位的话，有嵌套的关系先循环单位，再循环楼栋

在处理多层楼栋单位的高度和拉伸高度时，需要根据楼层的不同来计算每一层或每一单位的具体高度和拉伸高度。

如果是第一层的话，高度就等于最低点，拉伸高度就等于分割点

```js
height = +data.heightArr[0]; //最低点高度
extrudedHeight = +data.heightArr[1]; // 拉伸到的高度，即最高点
```

第二层的话，需要计算平均高度

```js
let itemHeight = (data.heightArr[2] - data.heightArr[1]) / (data.floorNum - 1);
```

根据平均高度计算高度和拉伸高度

```js
height = +data.heightArr[1] + itemHeight * (i - 1);
extrudedHeight = +data.heightArr[1] + itemHeight * i;
```

## 4.5. 清除实体

除了包裹体外，其他实体需要清除。而且还需要输入楼层数，才能得到分层结果。

```js
if (!data.floorNum) {
  ElMessage.info("请输入楼层数");
  return;
}

global.$viewer.entities.removeAll();
```

当你需要调整楼房的最低点、分割点和最高点的时候， 需要先清除包裹体，这时不能使用 removeAll 删除 primitives！如果使用了，3D 瓦片也会被删除。

当你添加包裹体后，将其放入数组中，后面再进行遍历删除。

```js
houseList.push(primitive);
```

遍历删除。

```js
houseList.length &&
  houseList.forEach((item) => {
    global.$viewer.scene.primitives.remove(item);
  });
houseList = [];
```

![QQ录屏20240702101531 -original-original](https://gitee.com/dongxiaogit/image2/raw/master/image/QQ录屏20240702101531 -original-original.gif)

## 4.6. 生成数据

点击提交数据后，将数据传递到后台，成功后，重置按钮并跳转到编辑房户信息的组件。

首先把最大多边形的字段串传递过去，如果你切分了，就把每个单位的多边形传递，如果没有切换，就传一个空数组，也要传递单位数组、高度数组等等。

```js
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
      reset();

      $router.push("/setInfo");
    }
  });
};
```

# 5. 重置

画笔结束绘制，清空实体，清空包裹体的数组，回到区域绘制，清空单位数组，还原地址前缀，清空高度数组，重置楼层数等等，重新进行楼房分户

```js
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
```

## 5.1. 事件销毁

在你不用组件后，需要在`onUnmounted`进行销毁组件的事件。

```js
// 销毁释放资源 不会影响其他组件
onUnmounted(() => {
  reset();
});
```

# 6. 编辑房户信息

接口说明：

```
getBuild (无参数）
getHouse （id 楼栋id pageIndex pageNum分页）
getOneHouselnfo （id 房户id）
updatelnfo (编辑好后用原字段返回)
```

进入该组件后，先获取后台的数据，渲染到选择器中。![image-20240702112224698](https://gitee.com/dongxiaogit/image2/raw/master/image/image-20240702112224698.png)

```js
getBuild().then((res) => {
  if (res.code == 200) {
    // console.log(res);
    data.buildArr = res.data;
    // console.log(data.buildArr);
  }
});
```

## 6.1. 楼层跳转

点击对应的楼栋，实现跳转，并渲染数据到页面。这里的跳转不是加载实体，而是相机的跳转，也就是找到面的终点，作为跳转的视角。使用 flyTo 需要将经纬度坐标转化为笛卡尔坐标，设置一个高度 200。

> 当然也可以在楼房分层步骤记录提交的视角，然后再使用该视角进行加载

```js
data.pickBuild = item.name;
const center = turf.center(item.polygon);
// console.log(center);
global.$viewer.camera.flyTo({
  destination: Cesium.Cartesian3.fromDegrees(
    ...center.geometry.coordinates,
    200
  ),
});
```

## 6.2. 获取数据

根据楼栋的 id，获取楼房数据。

```js
// 获得楼房的数据
const getHouseData = () => {
  getHouse(data.query).then((res) => {
    // console.log(res);
    data.tableData = res.data.list;
    data.total = res.data.total;
  });
};
```

![image-20240702143624327](https://gitee.com/dongxiaogit/image2/raw/master/image/image-20240702143624327.png)

## 6.3. 数据展示

使用插槽展示数据在页面上

```vue
<el-table-column prop="number" label="单元号">
          <template #default="scope">
            <el-tag type="success">{{ scope.row.number }}单元</el-tag>
          </template>
        </el-table-column>
```

![image-20240702144102066](https://gitee.com/dongxiaogit/image2/raw/master/image/image-20240702144102066.png)

## 6.4. 高亮楼层

点击表格的行数据，可以高亮相应 3D 瓦片的位置，再次点击的时候要注意删除上次点击的，还需要注意视角切换的时候，需要删除高亮的楼层。

需要将数组进行扁平化，三维数组变为一维数组。

```js
// 点击表格 跳到指定的楼房
let pickPrimitive;
const tableClick = (row) => {
  //删除之前的高亮 如果有就删掉
  pickPrimitive && global.$viewer.scene.primitives.remove(pickPrimitive);

  // console.log(row);
  // 对三维数组进行扁平化
  let arr = row.polygon.coordinates[0].flat();
  // console.log(arr);
  pickPrimitive = new Cesium.ClassificationPrimitive({
    geometryInstances: new Cesium.GeometryInstance({
      geometry: new Cesium.PolygonGeometry({
        polygonHierarchy: new Cesium.PolygonHierarchy(
          Cesium.Cartesian3.fromDegreesArray(arr)
        ),
        height: row.minHeight,
        extrudedHeight: row.maxHeight,
      }),
      attributes: {
        color: Cesium.ColorGeometryInstanceAttribute.fromColor(
          Cesium.Color.YELLOW.withAlpha(0.8) //颜色
        ),
      },
    }),
    classificationType: Cesium.ClassificationType.CESIUM_3D_TILE,
  });
  global.$viewer.scene.primitives.add(pickPrimitive);
};
```

![image-20240702144240574](https://gitee.com/dongxiaogit/image2/raw/master/image/image-20240702144240574.png)

## 6.5. 编辑信息

点击编辑信息，弹出对话框。对话框的信息是先查看后编辑，也就是点击的时候需要发送请求接口。

![image-20240702144756469](https://gitee.com/dongxiaogit/image2/raw/master/image/image-20240702144756469.png)

需要编辑的数据。

![image-20240702145122837](https://gitee.com/dongxiaogit/image2/raw/master/image/image-20240702145122837.png)

```vue
<!-- 弹出框 -->
<el-dialog
  :close-on-click-modal="false"
  :close-on-press-escape="false"
  @close="data.dialogVisible = false"
  v-model="data.dialogVisible"
  title="编辑信息"
  width="60%"
>
    <el-form
      :inline="true"
      label-position="right"
      label-width="100px"
      :model="data.houseInfo"
    >
      <h3 style="text-align: center; margin-bottom: 20px">业主信息</h3>
      <el-form-item style="width: 45%" label="业主姓名">
        <el-input v-model="data.houseInfo.ownerName" />
      </el-form-item>
      <el-form-item style="width: 45%" label="业主性别">
        <el-select
          style="width: 100%"
          v-model="data.houseInfo.ownerSex"
          placeholder="请选择性别"
        >
          <el-option label="男" value="1" />
          <el-option label="女" value="2" />
        </el-select>
      </el-form-item>
      <el-form-item style="width: 45%" label="身份证号">
        <el-input v-model="data.houseInfo.idCard" />
      </el-form-item>
      <el-form-item style="width: 45%" label="手机号码">
        <el-input v-model="data.houseInfo.phoneNum" />
      </el-form-item>
      <el-form-item style="width: 94.5%" label="业主住址">
        <el-input v-model.trim="data.houseInfo.nativePlace" />
      </el-form-item>
      <el-form-item style="width: 94.5%" label="业主头像">
        <span v-if="data.houseInfo.ownerImg">
          <el-image
            style="height: 37px"
            :src="'http://127.0.0.1:8090/' + data.houseInfo.ownerImg"
            :preview-src-list="['http://127.0.0.1:8090/' + data.houseInfo.ownerImg]"
            fit="cover"
          ></el-image>
        </span>
        <el-upload
          :mutiple="false"
          action="http://127.0.0.1:8090/api/v1/upload"
          :on-success="successOwner"
        >
          <button class="btn btn--stripe">{{
            data.houseInfo.ownerImg ? "重新上传" : "头像上传"
          }}</button>
          <!-- <el-button type="info" size="small">{{
            data.houseInfo.ownerImg ? "重新上传" : "头像上传"
          }}</el-button> -->
        </el-upload>
      </el-form-item>
      <el-form-item style="width: 45%" label="房屋类型">
        <el-input v-model="data.houseInfo.houseType" />
      </el-form-item>
      <el-form-item style="width: 45%" label="房屋面积">
        <el-input v-model="data.houseInfo.builtArea">
          <template #append>m²</template>
        </el-input>
      </el-form-item>
      <el-form-item style="width: 45%" label="房屋朝向">
        <el-input v-model="data.houseInfo.orientation" />
      </el-form-item>
      <el-form-item style="width: 45%" label="物业类型">
        <el-select
          style="width: 100%"
          v-model="data.houseInfo.propertyType"
          placeholder="请选择物业类型"
        >
          <el-option label="居民物业" value="1" />
          <el-option label="商业物业" value="2" />
          <el-option label="工业物业" value="3" />
          <el-option label="其他物业" value="4" />
        </el-select>
      </el-form-item>
      <el-form-item style="width: 40.5%" label="房屋号码">
        <el-input v-model="data.houseInfo.houseAddress" disabled />
      </el-form-item>
      <el-form-item style="width: 94.5%" label="户型图">
        <span v-if="data.houseInfo.houseImg">
          <el-image
            style="height: 37px; margin-right: 14px"
            :src="'http://127.0.0.1:8090/' + data.houseInfo.houseImg"
            :preview-src-list="['http://127.0.0.1:8090/' + data.houseInfo.houseImg]"
            fit="cover"
          />
        </span>
        <el-upload
          action="http://127.0.0.1:8090/api/v1/upload"
          multiple
          :on-success="successHouse"
        >
          <button class="btn btn--stripe">{{
            data.houseInfo.houseImg ? "重新上传" : "图片上传"
          }}</button>
          <!-- <el-button size="small" type="info">{{
            data.houseInfo.houseImg ? "重新上传" : "图片上传"
          }}</el-button> -->
        </el-upload>
      </el-form-item>
    </el-form>
    <div class="h-10">
      <button @click="toUpdateInfo" class="float-right mr-10 other-btn" type="primary"
        >提&nbsp;&nbsp;&nbsp;&nbsp;交</button
      >
    </div>
  </el-dialog>
```

编辑完成后，将数据提交到后台。

```js
// 提交数据到数据库
const toUpdateInfo = () => {
  updateInfo(data.houseInfo).then((res) => {
    if (res.code == 200) {
      ElMessage.success("编辑成功！");
      data.dialogVisible = false;
    }
  });
};
```

## 6.6. 事件销毁

```js
onUnmounted(() => {
  pickPrimitive && global.$viewer.scene.primitives.remove(pickPrimitive);
  pickPrimitive = null;
});
```

## 6.7. 小细节

如果你点击了分页，比如切换到分页 5，当你切换楼栋时，需要重新变为 1，不然还是停留在分页 5。

# 7. 查看房户信息

## 7.1. 加载数据

一开始跟编辑房户信息一样，获取楼房数据。

![image-20240702145332120](https://gitee.com/dongxiaogit/image2/raw/master/image/image-20240702145332120.png)

## 7.2. 气泡框

点击房户，弹出对应的信息框。当你点击房户的时候，会得到两个实体，一个是 3D 瓦片的实体，一个是`ClassificationPrimitive`，要进行区分，可以给`ClassificationPrimitive`加一个 id，这样就知道你点击的是哪个实体。

![image-20240702150639301](https://gitee.com/dongxiaogit/image2/raw/master/image/image-20240702150639301.png)

点击对应的楼层，每次都发送请求，弹出气泡框，同时要注意删除之前的气泡框。

```js
getOneHouseInfo({ id: pick.id }).then((res) => {
  if (res.code == 200) {
    // console.log(res);
    let houseInfo = res.data;
    //注意删除之前的气泡框
    bubble && bubble.windowClose();
    bubble = new Bubble({
      position,
      viewer: global.$viewer,
      houseInfo,
    });
  }
});
```

> Cesium 对话框实现的原理：笛卡尔坐标转为屏幕坐标，监听坐标在屏幕的变化，然后给我们不断地让气泡框进行定位，最后删除对话框后，清除监听事件。

## 7.3. 包裹体实现高亮

因为实体是`ClassificationPrimitive`，所以没有对应的 material 属性，可以使用`pick.primitive`原型上的`getGeometryInstanceAttributes`获取几何实例，需要传入一个 id，打印后获得一些属性。

```js
const attributes = pick.primitive.getGeometryInstanceAttributes(pick.id);
console.log(attributes);
```

![image-20240702152052313](https://gitee.com/dongxiaogit/image2/raw/master/image/image-20240702152052313.png)\*\*

然后给颜色重新赋值，高亮楼层。

```js
attributes.color = Cesium.ColorGeometryInstanceAttribute.toValue(
  Cesium.Color.YELLOW.withAlpha(0.88)
);
```

当你再次点击另一个楼层时，需要还原颜色，并给新的楼房赋值颜色。

```js
if (lastPick && lastPick.id != pick.id) {
  const lastAttributes = lastPick.primitive.getGeometryInstanceAttributes(
    lastPick.id
  );
  lastAttributes.color = Cesium.ColorGeometryInstanceAttribute.toValue(
    Cesium.Color.fromCssColorString(colors[pick.id % 9]).withAlpha(0.3) //颜色
  );
}
```

## 7.4. 事件销毁

```js
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
```
