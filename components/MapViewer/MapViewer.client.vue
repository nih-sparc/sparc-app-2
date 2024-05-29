<template>
  <div class="mapClass">
    <MapContent class="map" ref="map" :state="state" :starting-map="startingMap" :options="options"
        :share-link="shareLink" @updateShareLinkRequested="$emit('updateShareLinkRequested')" @isReady="$emit('isReady')" />
  </div>
</template>

<script>
  import { MapContent } from "@abi-software/mapintegratedvuer"
  
  export default {
    name: 'MapViewer',
    components: {
      MapContent,
    },
    props: {
      /**
       * A link (URL) to share.
       */
      shareLink: {
        type: String,
        default: undefined
      },
      /**
       * State containing state of the scaffold.
       */
      state: {
        type: Object,
        default: undefined
      },
      /**
       * The options include APIs and Keys.
       */
      options: {
        type: Object,
        default: () => {},
        required: true
      },
      /**
       * New option to start the map in AC, FC or WholeBody.
       */
      startingMap: {
        type: String,
        default: "AC"
      }
    },
    methods: {
      getInstance: function(){
        return this.$refs.map;
      },
    },
  }
</script>

<style scope lang="scss">
//@import 'sparc-design-system-components-2/src/assets/_variables.scss';
@import '@abi-software/mapintegratedvuer/dist/style.css';
@import '@abi-software/mapintegratedvuer/src/assets/mapicon-species-style.css';

.mapClass {
  position: relative;
  width: 100%;
  height: 100%;
  border: solid 1px #dcdfe6;
  box-shadow: 0 1px 8px 0 rgba(0, 0, 0, 0.06);

  .map-icon {
    color: #8300bf;
  }

  .background-popper.el-popover.el-popper,
  .open-map-popper.el-popover.el-popper {
    background: #fff !important;
    width: unset !important;
  }

  .pathway-container {
    .container {
      padding-left: 0px;
    }
  }

  .el-popover.right-popper {
    .popper__arrow {
      border-top-color: transparent !important;
      border-bottom-color: transparent !important;
    }
  }
}

.gallery-popper {
  background: #f3ecf6 !important;
  border: 1px solid #8300bf;
  border-radius: 4px;
  color: #303133 !important;
  font-size: 12px;
  line-height: 1rem;
  height: 1rem;
  padding: 10px;

  &.el-popper[x-placement^='top'] {
    .popper__arrow {
      border-top-color: #8300bf !important;
    }

    .popper__arrow:after {
      border-top-color: #f3ecf6 !important;
    }
  }
}
</style>
