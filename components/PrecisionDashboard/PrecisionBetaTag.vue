<template>
  <el-tooltip
    placement="right-start"
    content="Under active development"
    popper-class="beta-tooltip"
    effect="customized"
  >
    <template #default>
      <div class="beta-tag">
        <el-icon class="beta-icon"><WarningFilled /></el-icon>Beta
      </div>
    </template>
  </el-tooltip>
</template>

<style scoped lang="scss">
.beta-tag {
  display: flex;
  align-items: center;
  width: fit-content;
  color: #ff8400;
}
.beta-icon {
  font-size: 25px;
}
:deep(.beta-icon svg > path) {
  fill: #ff8400 !important;
}
:global(.beta-tooltip) {
  display: flex;
  width: fit-content;
}
:global(.beta-tooltip.el-popper.is-customized .el-popper__arrow::before) {
  background-color: #ffe8ec !important;
}
:global(.beta-tooltip.el-popper.is-customized) {
  background: #ffe8ec !important;
  border-color: #981f32 !important;
  border-radius: 4px;
}
</style>
