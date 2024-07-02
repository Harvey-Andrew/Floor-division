<template>
  <el-card class="setinfo rounded-xl">
    <template #header>
      <div class="card-header">
        <span style="font-weight: 600; font-size: 18px">编辑房户信息</span>
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
    <div class="user_skills">
      <el-table
        :data="data.tableData"
        stripe
        style="width: 100%; height: 100%"
        @row-click="tableClick"
        min-height="502px"
      >
        <el-table-column prop="date" label="门牌号">
          <template #default="scope">
            <el-tag type="primary"
              >{{ scope.row.floorNum
              }}{{
                scope.row.number > 9 ? scope.row.number : "0" + scope.row.number
              }}</el-tag
            >
          </template>
        </el-table-column>
        <el-table-column prop="number" label="单元号">
          <template #default="scope">
            <el-tag type="success">{{ scope.row.number }}单元</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="floorNum" label="楼层">
          <template #default="scope">
            <el-tag type="warning">{{ scope.row.floorNum }}楼</el-tag></template
          >
        </el-table-column>
        <el-table-column label="操作">
          <template #default="scope">
            <el-button type="info" size="small" plain @click="editInfo(scope.row)">
              编辑信息
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <button @click="toHouse" type="success" class="mt-5 w-30 other-btn">
        房户信息
      </button>
      <el-pagination
        class="float-right mt-5 mb-3"
        layout="prev, pager, next"
        :total="data.total"
        @current-change="changePage"
      />
    </div>
  </el-card>

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
</template>
<script setup>
import * as Cesium from "cesium";
import { reactive, getCurrentInstance, onMounted, onUnmounted } from "vue";
import * as turf from "@turf/turf";
import { getBuild } from "../api/buildApi";
import { ElMessage } from "element-plus";
import { getHouse, getOneHouseInfo, updateInfo } from "@/api/houseApi";
import { useRouter } from "vue-router";
const { appContext } = getCurrentInstance();
const global = appContext.config.globalProperties;
const data = reactive({
  buildArr: [],
  pickBuild: null,
  query: {
    pageIndex: 1,
    pageNum: 10,
  },
  tableData: [],
  total: 0,
  dialogVisible: false,
});
onMounted(() => {
  initData();
});

const successOwner = (file) => {
  data.houseInfo.ownerImg = file.data;
};
const successHouse = (file) => {
  data.houseInfo.houseImg = file.data;
};

// 编辑信息
const editInfo = (house) => {
  getOneHouseInfo({ id: house.id }).then((res) => {
    if (res.code == 200) {
      // console.log(res);
      data.houseInfo = res.data;
      data.dialogVisible = true;
      let houseNum = house.number > 9 ? house.number : "0" + house.number;
      data.houseInfo.houseAddress =
        house.number + "单元" + house.floorNum + houseNum + "室";
    }
  });
  // console.log(row);

  // console.log(data.houseInfo.id);
};
// 提交数据到数据库
const toUpdateInfo = () => {
  updateInfo(data.houseInfo).then((res) => {
    if (res.code == 200) {
      ElMessage.success("编辑成功！");
      data.dialogVisible = false;
    }
  });
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

// 点击表格 跳到指定的楼房
let pickPrimitive;
const tableClick = (row) => {
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
// 视角切换
// 可以在楼层分割时做一个视角切换的点 就不用寻找中心点了
const changBuild = (item) => {
  pickPrimitive && global.$viewer.scene.primitives.remove(pickPrimitive);
  pickPrimitive=null
  data.pickBuild = item.name;
  const center = turf.center(item.polygon);
  // console.log(center);
  global.$viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(...center.geometry.coordinates, 200),
  });
  data.query.id = item.id;
  data.query.pageIndex = 1;
  getHouseData();
};

// 获得楼房的数据
const getHouseData = () => {
  getHouse(data.query).then((res) => {
    // console.log(res);
    data.tableData = res.data.list;
    data.total = res.data.total;
  });
};

// 改变页数
const changePage = (index) => {
  data.query.pageIndex = index;
  getHouseData();
};
const $router = useRouter();
const toHouse = () => {
  $router.push("/house");
};
onUnmounted(() => {
  pickPrimitive && global.$viewer.scene.primitives.remove(pickPrimitive);
  pickPrimitive = null;
});
</script>
<style lang="scss">
.setinfo {
  width: 32%;
  position: absolute;
  top: 4%;
  left: 4%;
  z-index: 999;
  border-radius: 10px;
  background-image: linear-gradient(120deg, #e0c3fc 0%, #8ec5fc 100%);
  .el-card__body {
    .el-table {
      td {
        text-align: center !important;
      }
      th {
        text-align: center !important;
      }
    }
  }
}

// .el-upload-list {
//   display: none !important;
// }
#dialog {
  height: 100vh;
}
.el-dialog {
  margin: 30px auto;
  border-radius:10px;
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

.user_skills .el-table,
.el-table__expanded-cell {
  background-color: transparent !important;
}

.user_skills .el-table tr {
  background-color: transparent !important;
}
.user_skills .el-table--enable-row-transition .el-table__body td,
.el-table .cell {
  background-color: transparent !important;
}
.el-table::before {
  //去除底部白线
  left: 0;
  bottom: 0;
  width: 100%;
  height: 0px;
}
.el-table td.el-table__cell,
.el-table th.el-table__cell.is-leaf {
  border-bottom: none;
}
.el-table th.el-table__cell {
  background-color: transparent !important;

}
.el-table .cell{
  color:black
}

.el-pagination {
  button:disabled {
    background-color: transparent;
    color: black;
  }
  .el-pager li{
    background-color: transparent;
  }
  button{
    background-color: transparent;
    color: black;
  }

}
.el-card {
  border: none;
}
</style
