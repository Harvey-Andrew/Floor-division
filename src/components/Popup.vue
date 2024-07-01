<template>
  <div class="box">
    <div class="pine"></div>
    <div class="box-wrap">
      <div class="close" @click="closeClick">X</div>

      <div>
        <div class="area">
          <div class="area-title fontColor">业主信息</div>
        </div>
        <div class="content textColor">
          <div style="width: 30%; float: left; margin-left: 10px">
            <img
              style="width: 100px; height: 100px"
              :src="
                houseInfo.ownerImg
                  ? 'http://127.0.0.1:8090/' + houseInfo.ownerImg
                  : '/src/assets/img/noImg.png'
              "
            />
          </div>
          <div style="width: 55%; float: right">
            <div class="data-li">
              <div>业主姓名：</div>
              <div>
                <span>{{ houseInfo.ownerName }}</span>
              </div>
            </div>
            <div class="data-li">
              <div>业主性别：</div>
              <div>
                <span>{{ houseInfo.ownerSex }}</span>
              </div>
            </div>
            <div class="data-li">
              <div>身份证号：</div>
              <div>
                <span :title="houseInfo.idCard">{{ houseInfo.idCard }}</span>
              </div>
            </div>
            <div class="data-li">
              <div>手机号码：</div>
              <div>
                <span style="font-size: 12px">{{ houseInfo.phoneNum }}</span>
              </div>
            </div>
            <div class="data-li">
              <div>业主住址：</div>
              <div>
                <span :title="houseInfo.nativePlace">{{
                  houseInfo.nativePlace
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div>
        <div class="area area2">
          <div class="area-title fontColor">房屋信息</div>
        </div>
        <div class="content textColor">
          <div style="width: 30%; float: left; margin-left: 10px">
            <img
              style="width: 100px; height: 100px"
              :src="
                houseInfo.houseImg
                  ? 'http://127.0.0.1:8090/' + houseInfo.houseImg
                  : '/src/assets/img/noImg.png'
              "
            />
          </div>
          <div style="width: 55%; float: right">
            <div class="data-li">
              <div>房屋类型：</div>
              <div>
                <span>{{ houseInfo.houseType }}</span>
              </div>
            </div>
            <div class="data-li">
              <div>房屋面积：</div>
              <div>
                <span>{{ houseInfo.builtArea }}</span
                >{{ houseInfo.builtArea && "m²" }}
              </div>
            </div>
            <div class="data-li">
              <div>房屋朝向：</div>
              <div>
                <span>{{ houseInfo.orientation }}</span>
              </div>
            </div>
            <div class="data-li">
              <div>物业类型：</div>
              <div>
                <span>{{ houseInfo.propertyType }}</span>
              </div>
            </div>
            <div class="data-li">
              <div>房屋号码：</div>
              <div>
                <span>{{ houseInfo.houseAddress }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { getCurrentInstance, onMounted, onBeforeUpdate } from "vue";
const { houseInfo } = defineProps(["houseInfo"]);
switch (houseInfo.propertyType) {
  case "1":
    houseInfo.propertyType = "居民物业";
    break;
  case "2":
    houseInfo.propertyType = "商业物业";
    break;
  case "3":
    houseInfo.propertyType = "工业物业";
    break;
  case "4":
    houseInfo.propertyType = "其他物业";
    break;
}
switch (houseInfo.ownerSex) {
  case "1":
    houseInfo.ownerSex = "男";
    break;
  case "2":
    houseInfo.ownerSex = "女";
    break;
}
let that;

const closeClick = () => {
  that.closeEvent();
};
onMounted(() => {
  that = getCurrentInstance().vnode;
});
</script>
<style lang="scss">
.box {
  width: 300px;
  position: relative;
  bottom: 0;
  left: 0;
}
.close {
  position: absolute;
  color: #fff;
  top: 1px;
  right: 10px;
  text-shadow: 2px 2px 2px #022122;
  cursor: pointer;
  animation: fontColor 1s;
}
.box-wrap {
  position: absolute;
  left: 21%;
  top: 0;
  width: 100%;
  height: 313px;
  border-radius: 50px 0px 50px 0px;
  border: 1px solid #38e1ff;
  background-color: #38e1ff4a;
  box-shadow: 0 0 10px 2px #29baf1;
  animation: slide 2s;
}
.box-wrap .area {
  position: absolute;
  top: 20px;
  right: 0;
  width: 95%;
  height: 30px;
  background-image: linear-gradient(to left, #4cdef9, #4cdef96b);
  border-radius: 30px 0px 0px 0px;
  animation: area 1s;
}
.box-wrap .area2 {
  top: 163px;
}
.pine {
  position: absolute;
  width: 100px;
  height: 100px;
  box-sizing: border-box;
  line-height: 120px;
  text-indent: 5px;
}

.pine::before {
  content: "";
  position: absolute;
  left: 0;
  bottom: -83px;
  width: 40%;
  height: 200px;
  box-sizing: border-box;
  border-bottom: 1px solid #38e1ff;
  transform-origin: bottom center;
  transform: rotateZ(135deg) scale(1.5);
  animation: slash 0.5s;
  filter: drop-shadow(1px 0px 2px #03abb4);
  /* transition: slash 2s; */
}

.area .area-title {
  text-align: center;
  line-height: 30px;
}
.textColor {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  text-shadow: 1px 1px 5px #002520d2;
  animation: fontColor 1s;
}
.yellowColor {
  font-size: 14px;
  font-weight: 600;
  color: #f09e28;
  text-shadow: 1px 1px 5px #002520d2;
  animation: fontColor 1s;
}

.fontColor {
  font-size: 16px;
  font-weight: 800;
  color: #ffffff;
  text-shadow: 1px 1px 5px #002520d2;
  animation: fontColor 1s;
}
.content {
  padding: 55px 10px 10px 10px;
  height: 80px;
}
.content .data-li {
  display: flex;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

@keyframes fontColor {
  0% {
    color: #ffffff00;
    text-shadow: 1px 1px 5px #00252000;
  }
  40% {
    color: #ffffff00;
    text-shadow: 1px 1px 5px #00252000;
  }
  100% {
    color: #ffffff;
    text-shadow: 1px 1px 5px #002520d2;
  }
}

@keyframes slide {
  0% {
    border: 1px solid #38e1ff00;
    background-color: #38e1ff00;
    box-shadow: 0 0 10px 2px #29baf100;
  }

  100% {
    border: 1px solid #38e1ff;
    background-color: #38e1ff4a;
    box-shadow: 0 0 10px 2px #29baf1;
  }
}
@keyframes area {
  0% {
    width: 0%;
  }
  25% {
    width: 0%;
  }

  100% {
    width: 95%;
  }
}

@keyframes slash {
  0% {
    transform: rotateZ(135deg) scale(0);
  }

  100% {
    transform: rotateZ(135deg) scale(1.5);
  }
}
</style>