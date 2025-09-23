<template>
  <el-table :data="tableData" :show-header="false" empty-text="No Results">
    <!-- Left column: Thumbnails -->
    <el-table-column prop="banners" label="Images" width="160">
      <template v-slot="scope">
        <div class="img-grid">
          <nuxt-link
            :to="{
              name: 'datasets-datasetId',
              params: { datasetId: scope.row.id }
            }"
            class="img-dataset"
          >
            <div
              class="grid"
              :style="{
                gridTemplateColumns: `repeat(${getGridCols(scope.row?.doiCollection?.size)}, 1fr)`,
                gridTemplateRows: `repeat(${getGridRows(scope.row?.doiCollection?.size)}, 1fr)`
              }"
            >
              <img
                v-for="(img, index) in scope.row?.doiCollection?.banners"
                :key="index"
                :src="img"
                :alt="`Banner ${index+1} for ${scope.row.title}`"
              />
            </div>
          </nuxt-link>
        </div>
      </template>
    </el-table-column>
    <el-table-column min-width="400">
      <template v-slot="scope">
        <div class="pl-12">
          <nuxt-link
            :to="{
              name: 'collections-collectionId',
              params: { collectionId: scope.row.id }
            }"
            class="font-bold text-lg"
            v-html="scope.row.name"
          />
          <div
            class="my-8 text-gray-700"
            v-if="scope.row.description"
            v-html="scope.row.description"
          />
        </div>
      </template>
    </el-table-column>
  </el-table>
</template>

<script>
import FormatDate from '@/mixins/format-date'

export default {
  name: 'CollectionsSearchResults',

  mixins: [FormatDate],

  props: {
    tableData: {
      type: Array,
      default: () => []
    }
  },

  data() {
    return {
      PROPERTY_DATA: [
        {
          displayName: 'Created By',
          propPath: 'owner'
        },
        {
          displayName: 'Number of Datasets',
          propPath: 'datasetCount'
        },
        {
          displayName: 'Created On',
          propPath: 'createdAt'
        },
        {
          displayName: 'Last Updated',
          propPath: 'updatedAt'
        }
      ]
    }
  },

  methods: {
    getGridCols(count) {
      if (count === 1) return 1
      if (count <= 4) return 2
      return 3
    },
    getGridRows(count) {
      if (count === 1) return 1
      if (count <= 4) return 2
      return Math.ceil(count / 3)
    },
    getNestedProperty(obj, path, defaultValue = undefined) {
      if (!path) return obj ?? defaultValue;

      const keys = path
        .replace(/\[(\d+)\]/g, '.$1')
        .split('.')
        .filter(Boolean);

      return keys.reduce((acc, key) => {
        if (acc == null) return undefined;
        return acc[key];
      }, obj) ?? defaultValue;
    },

    getPropertyValue(item, property) {
      const value = this.getNestedProperty(item, property.propPath);
      if (!value) return undefined;

      switch (property.displayName) {
        case 'Created On':
        case 'Last Updated':
          return this.formatDate(value);
        case 'Number of Datasets':
          return `${value} datasets`;
        case 'Created By':
          return value.name ? value.name : value; // either a name string or {name: "..."}
        default:
          return value;
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.el-table {
  width: 100%;
}

.el-table--enable-row-hover .el-table__body tr {
  background-color: transparent;
}

.img-dataset {
  display: block;
  position: relative;
  img {
    display: block;
  }
}

.property-table {
  td {
    background-color: transparent;
    padding: 0.25rem 0 0 0;
    border: none;
  }
  background-color: transparent;
  border: none;
  padding: 0;
}

table:not([class^='el-table__'])::before {
  display: none;
}

.property-name-column {
  width: 180px;
  font-weight: bold;
}
.img-grid {
  display: block;
  width: 160px;
  height: 160px;

  .grid {
    display: grid;
    gap: 2px;
    width: 100%;
    height: 100%;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 2px;
  }
}
</style>
