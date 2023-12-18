<script>
import { Bar, mixins } from 'vue-chartjs'
import ChartDataLabels from 'chartjs-plugin-datalabels';

export default {
  extends: Bar,
  mixins: [mixins.reactiveProp],
  name: 'BarChart',
  props: {
    chartData: {
      type: Object,
      default: () => {}
    },
    chartOptions: {
      type: Object,
      default: () => {}
    }
  },
  mounted() {
    this.addPlugin(ChartDataLabels)
    this.renderChart(this.chartData, this.chartOptions)
  }
}
</script>
