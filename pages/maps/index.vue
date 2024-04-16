<script>
import { pathOr, isEmpty } from 'ramda'
import { infoMessage } from '@/utils/notification-messages'
export default {
  async setup() {
    const route = useRoute()
    const router = useRouter()
    const typeParam = pathOr('', ['query', 'type'], route)
    let newPath = ''
    if (isEmpty(typeParam)) {
      newPath = route.href.replace('/maps', '/apps')
      infoMessage('All available map viewers have now been integrated with SPARC Apps and can be found below!')
    } else {
      newPath = route.href.replace('/maps', '/apps/maps')
    }
    await navigateTo(newPath, { redirectCode: 301 })
  }
}
</script>