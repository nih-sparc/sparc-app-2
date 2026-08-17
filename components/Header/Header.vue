<template>
  <div class="sparc-header">
    <nav class="nav" :class="{ 'nav--scrolled': scrolled }">
      <!-- Logo -->
      <nuxt-link :to="{ name: 'index' }" class="nav-logo" aria-label="SPARC">
        <img src="/sparc-logo-primary.svg" alt="SPARC" height="auto" />
      </nuxt-link>

      <!-- Desktop nav -->
      <div class="nav-links">
        <div
          v-for="item in navItems"
          :key="item.id"
          class="nav-item"
          :class="{ open: activeDropdown === item.id }"
          @mouseenter="openDropdown(item.id)"
          @mouseleave="closeDropdown(item.id)"
        >
          <button class="nav-btn" @click="toggleDropdown(item.id)">
            {{ item.label }}
            <svg class="nav-chevron" viewBox="0 0 10 6" width="10" height="6" fill="none">
              <path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <div class="dropdown">
            <div class="dd-aside">
              <!-- eslint-disable-next-line vue/no-v-html -->
              <span class="dd-aside-icon" v-html="item.iconHtml" />
              <div class="dd-aside-lbl">{{ item.iconLabel }}</div>
            </div>
            <div class="dd-links">
              <template v-for="(link, i) in item.links" :key="i">
                <div v-if="link.divider" class="dd-divider" />
                <a
                  v-else-if="link.external"
                  class="dd-link"
                  :href="link.href"
                  target="_blank"
                  @click="closeAll"
                >
                  <div class="dd-link-title">{{ link.title }}</div>
                  <div class="dd-link-sub">{{ link.sub }}</div>
                </a>
                <nuxt-link
                  v-else
                  class="dd-link"
                  :to="link.href"
                  @click="closeAll"
                >
                  <div class="dd-link-title">{{ link.title }}</div>
                  <div class="dd-link-sub">{{ link.sub }}</div>
                </nuxt-link>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- Right actions -->
      <div class="nav-right">
        <client-only>
          <button v-if="!userProfile" class="nav-signin-btn" @click="showLoginDialog = true">Sign in</button>
          <div
            v-else
            class="nav-user"
            :class="{ open: activeDropdown === 'user' }"
            @mouseenter="openDropdown('user')"
            @mouseleave="closeDropdown('user')"
          >
            <button class="nav-btn" @click="toggleDropdown('user')">{{ username }}</button>
            <div class="user-dropdown">
              <button class="user-dd-item" @click="handleUserMenuSelect('profile', ['user','profile'])">Profile</button>
              <button class="user-dd-item" @click="handleUserMenuSelect('logout', ['user','logout'])">Logout</button>
            </div>
          </div>
        </client-only>
        <button class="mobile-menu-btn" @click="openMobileNav" aria-label="Open menu">
          <svgo-icon-hamburger height="30" width="30" />
        </button>
      </div>
    </nav>
  </div>

  <!-- Mobile overlay -->
    <div v-if="menuOpen" class="mobile-overlay" @click="closeMobileNav">
      <div class="mobile-nav" @click.stop>
        <ul class="mobile-nav-links">
          <li
            v-for="item in navItems"
            :key="item.id"
            class="mobile-nav-item"
            :class="{ open: mobileOpenSection === item.id }"
          >
            <button class="mobile-nav-btn" @click="toggleMobileSection(item.id)">
              {{ item.label }}
              <svg class="nav-chevron" viewBox="0 0 10 6" width="10" height="6" fill="none">
                <path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <ul v-show="mobileOpenSection === item.id" class="mobile-sub-links">
              <template v-for="(link, i) in item.links" :key="i">
                <li v-if="!link.divider">
                  <a
                    v-if="link.external"
                    :href="link.href"
                    target="_blank"
                    @click="closeMobileNav"
                  >{{ link.title }}</a>
                  <nuxt-link
                    v-else
                    :to="link.href"
                    :class="{ active: activeLink(link.href) }"
                    @click="closeMobileNav"
                  >{{ link.title }}</nuxt-link>
                </li>
              </template>
            </ul>
          </li>
        </ul>
        <ul class="mobile-util-links">
          <li>
            <client-only>
              <button v-if="!userProfile" class="mobile-signin-btn" @click="showLoginDialog = true; closeMobileNav()">Sign in</button>
              <span v-else>
                <a class="sign-in-link" @click="handleUserMenuSelect('profile', ['user','profile']); closeMobileNav()">Profile</a>
                <a class="sign-in-link" @click="handleUserMenuSelect('logout', ['user','logout']); closeMobileNav()">Logout</a>
              </span>
            </client-only>
          </li>
        </ul>
        <div class="mobile-social">
          <a href="https://bsky.app/profile/sparc.science" target="_blank">
            <svgo-icon-bluesky class="social-icon" />
          </a>
          <a href="https://www.youtube.com/results?search_query=sparc+nih" target="_blank">
            <svgo-icon-youtube class="social-icon" />
          </a>
        </div>
      </div>
    </div>

  <login-modal :show-dialog="showLoginDialog" @dialog-closed="showLoginDialog = false" />
</template>

<script>
import LoginModal from '@/components/LoginModal/LoginModal.vue'
import { useMainStore } from '../../store/index.js'
import { mapActions, mapState } from 'pinia'

const DB_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32"><ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6"/><path d="M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6"/></svg>`
const UPLOAD_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32"><path d="M12 3v12m0-12l-4 4m4-4l4 4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>`
const USERS_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M21 21v-2a4 4 0 0 0-3-3.85"/></svg>`
const TOOLS_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`

const MOBILE_BREAKPOINT = 680

const navItems = [
  {
    id: 'access',
    label: 'Access',
    iconLabel: '400+ open resources\nFree, no account required',
    iconHtml: DB_ICON,
    links: [
      { title: 'Datasets & models', sub: 'Search across all resources', href: '/data?type=dataset' },
      { title: 'Flatmap', sub: 'Navigate by anatomy', href: '/apps/maps?type=ac' },
      { title: 'Projects', sub: 'Browse projects from supported consortia', href: '/about/projects' },
      { title: 'News', sub: 'Updates from the community', href: '/news-and-events' },
      { divider: true },
      { title: 'Documentation', sub: 'Guides, tutorials, and help', href: 'https://docs.sparc.science/', external: true },
      { title: 'Support', sub: 'Contact us with questions or feedback', href: '/contact-us' },
    ]
  },
  {
    id: 'contribute',
    label: 'Contribute',
    iconLabel: 'Share your research',
    iconHtml: UPLOAD_ICON,
    links: [
      { title: 'Submit data', sub: 'Deposit datasets and protocols', href: '/share-data' },
      { title: 'Join a consortium', sub: 'Collaborative research groups', href: '/about/what-we-offer' },
      { divider: true },
      { title: 'Feedback', sub: 'Help us improve', href: '/contact-us?type=feedback' },
    ]
  },
  {
    id: 'community',
    label: 'Community',
    iconLabel: 'Research communities',
    iconHtml: USERS_ICON,
    links: [
      { title: 'NIH PRECISION Human Pain', sub: 'Peripheral pain pathways · human focus', href: '/about/consortia/precision' },
      { title: 'HEAL RE-JOIN', sub: 'Regenerative peripheral nerve interfaces', href: '/about/consortia/re-join' },
      { title: 'SPARC Program', sub: 'Autonomic nervous system mapping', href: '/about/consortia/sparc' },
      { title: 'VITAL', sub: 'Visceral pain and interoception', href: '/about/consortia/vital' },
      { divider: true },
      { title: 'About the DRC', sub: 'The SPARC Data and Resource Center', href: '/about' },
      { title: 'Share', sub: 'Share a news, event, or story that you would like to highlight', href: '/news-and-events' },
    ]
  },
  {
    id: 'tools',
    label: 'Tools',
    iconLabel: 'Tools & Resources',
    iconHtml: TOOLS_ICON,
    links: [    
      { title: 'Apps', sub: 'Tools to help you Find, Use, and Share', href: '/apps' },
      { title: 'Explore', sub: 'Browse all tools & resources', href: '/tools-and-resources' },
      { divider: true },
      { title: 'Share a tool', sub: 'Register software or models', href: '/contact-us?type=tool' },
    ]
  }
]

export default {
  name: 'SparcHeader',
  components: { LoginModal },
  data: () => ({
    navItems,
    menuOpen: false,
    showLoginDialog: false,
    activeDropdown: null,
    mobileOpenSection: null,
    scrolled: false,
  }),
  computed: {
    ...mapState(useMainStore, ['userProfile', 'profileComplete', 'userToken', 'username']),
    firstPath() {
      const path = this.$route.path
      const endIndex = path.indexOf('/', 1)
      return endIndex === -1 ? path.substring(0) : path.substring(0, endIndex)
    },
  },
  mounted() {
    document.addEventListener('click', this.handleDocumentClick)
    window.addEventListener('scroll', this.onScroll, { passive: true })
    window.addEventListener('resize', this.onResize)
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleDocumentClick)
    window.removeEventListener('scroll', this.onScroll)
    window.removeEventListener('resize', this.onResize)
  },
  watch: {
    profileComplete: {
      handler() { this.verifyProfileComplete() },
      immediate: true
    },
    '$route.path': {
      handler(val) {
        if (val) this.menuOpen = false
        this.verifyProfileComplete()
      },
      immediate: true
    },
    menuOpen: {
      handler(val) {
        if (!val) this.updateDisabledScrolling(false)
      },
      immediate: true
    }
  },
  methods: {
    ...mapActions(useMainStore, ['updateDisabledScrolling', 'logout']),
    onScroll() {
      this.scrolled = window.scrollY > 0
    },
    onResize() {
      if (this.menuOpen && window.innerWidth > MOBILE_BREAKPOINT) this.closeMobileNav()
    },
    handleDocumentClick(e) {
      if (!e.target.closest('.nav-item') && !e.target.closest('.nav-user')) {
        this.activeDropdown = null
      }
    },
    toggleDropdown(id) {
      this.activeDropdown = this.activeDropdown === id ? null : id
    },
    openDropdown(id) {
      this.activeDropdown = id
    },
    closeDropdown(id) {
      if (this.activeDropdown === id) this.activeDropdown = null
    },
    toggleMobileSection(id) {
      this.mobileOpenSection = this.mobileOpenSection === id ? null : id
    },
    closeAll() {
      this.activeDropdown = null
    },
verifyProfileComplete() {
      if (this.userProfile) {
        if (!this.profileComplete) {
          if (this.$route.name !== 'welcome') this.$router.push('/welcome')
        } else if (this.$route.name === 'welcome') {
          this.$router.push('/')
        }
      }
    },
    handleUserMenuSelect(menuId, menuIdPath) {
      this.activeDropdown = null
      if (menuId === 'logout') this.logout()
      if (menuId === 'profile') this.$router.push('/user/profile')
    },
    activeLink(query) {
      if (this.firstPath.includes(query.split('?')[0])) return true
      if (query.split('?')[0].replace('/', '') === 'data' && this.firstPath.replace('/', '') === 'datasets') return true
      return false
    },
    openMobileNav() {
      if (!this.menuOpen) {
        this.updateDisabledScrolling(true)
        this.menuOpen = true
      } else {
        this.closeMobileNav()
      }
    },
    closeMobileNav() {
      this.menuOpen = false
      this.mobileOpenSection = null
      this.updateDisabledScrolling(false)
    },
  }
}
</script>

<style scoped lang="scss">
@import 'sparc-design-system-components-2/src/assets/_variables.scss';

.sparc-header {
  width: 100%;
  position: sticky;
  top: 0;
  z-index: 100;
}

/* ── Main nav bar ── */
.nav {
  background: #fff;
  height: 80px;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  border-bottom: 1px solid transparent;
  transition: border-color 0.2s ease;
  &.nav--scrolled {
    border-bottom-color: #E4E7ED;
  }
}

.nav-logo {
  display: flex;
  align-items: center;
  text-decoration: none;
  flex-shrink: 0;
  width: 100px;
  margin-top: .5rem;
}

/* ── Desktop nav links ── */
.nav-links {
  display: flex;
  align-items: center;
  gap: 0;
  margin-left: auto;
  @media (max-width: 680px) { display: none; }
}

.nav-item {
  position: relative;
  &:last-child .dropdown,
  &:nth-last-child(2) .dropdown {
    left: auto;
    right: 0;
    transform: none;
  }
}



.nav-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 16px;
  color: #24245b;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0 10px;
  height: 80px;
  font-family: inherit;
  letter-spacing: 0.02em;
  transition: color 0.15s;
  white-space: nowrap;
  &:hover,
  .nav-item.open & {
    color: #8300bf;
  }
}

.nav-chevron {
  opacity: 0.5;
  transition: transform 0.2s;
  flex-shrink: 0;
  .nav-item.open & {
    transform: rotate(180deg);
    opacity: 1;
  }
}

/* ── Dropdown ── */
.dropdown {
  display: none;
  position: absolute;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  width: 420px;
  max-width: calc(100vw);
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  z-index: 200;
  .nav-item.open & {
    display: flex;
  }
}

.dd-aside {
  width: 140px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 1.5rem 1rem;
  background: #F9F2FC;
}

.dd-aside-icon {
  color: $purple;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dd-aside-lbl {
  font-size: 10px;
  color: $purple;
  text-align: center;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  line-height: 1.5;
}

.dd-links {
  flex: 1;
  padding: 12px;
}

.dd-divider {
  height: 1px;
  background: #e4e7ed;
  margin: 7px 0;
}

.dd-link {
  display: block;
  padding: 7px 8px;
  border-radius: 8px;
  text-decoration: none;
  transition: background 0.12s;
  &:hover {
    .dd-link-title{
      color: #8300bf;
    }
    background: #f9f2fc;
  }
}

.dd-link-title {
  font-size: 12px;
  color: #24245b;
  font-weight: 500;
}

.dd-link-sub {
  font-size: 11px;
  color: #909399;
  margin-top: 1px;
}

/* ── Right actions ── */
.nav-right {
  margin-left: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  @media (max-width: 680px) { margin-left: auto; }
}


.nav-signin-btn {
  font-size: 16px;
  color: #24245b;
  background: none;
  border: 1px solid #24245b;
  border-radius: 7px;
  padding: 5px 12px;
  cursor: pointer;
  font-family: inherit;
  transition: color 0.15s, background 0.15s, border-color 0.15s;
  &:hover {
    color: #8300bf;
    background: #f9f2fc;
    border-color: #8300bf;
  }
  @media (max-width: 680px) { display: none; }
}

/* Authenticated user dropdown */
.nav-user {
  position: relative;
  .user-dropdown {
    display: none;
    position: absolute;
    top: 100%;
    right: 0;
    background: #fff;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    min-width: 120px;
  }
  &.open .user-dropdown {
    display: block;
  }
}

.user-dd-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 9px 14px;
  font-size: 13px;
  color: #24245b;
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.12s, color 0.12s;
  &:hover {
    background: #f5f7fa;
    color: #8300bf;
  }
}

/* ── Mobile hamburger ── */
.mobile-menu-btn {
  display: none;
  background: none;
  border: none;
  color: #24245b;
  cursor: pointer;
  padding: 10px;
  align-items: center;
  justify-content: center;
  @media (max-width: 680px) { display: flex; }

  svg {
    width: 32px !important;
    height: 32px !important;
  }
}

/* ── Mobile overlay & nav ── */
.mobile-overlay {
  position: fixed;
  inset: 0;
  top: 80px;
  background: rgba(0, 0, 0, 0.5);
  z-index: 99;
}

.mobile-nav {
  position: fixed;
  top: 80px;
  left: 0;
  bottom: 0;
  width: 70%;
  max-width: 320px;
  background: #f5f7fa;
  border-right: 1px solid #e4e7ed;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  z-index: 100;
}

.mobile-nav-links {
  list-style: none;
  padding: 0;
  margin: 0 0 0.5rem;
}

.mobile-nav-item {
  margin: 0;
}

.mobile-nav-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px 4px;
  font-size: 15px;
  font-weight: 500;
  font-family: inherit;
  color: #24245b;
  background: none;
  border: none;
  cursor: pointer;
  .nav-chevron {
    opacity: 0.5;
    transition: transform 0.2s;
  }
  .mobile-nav-item.open & .nav-chevron {
    transform: rotate(180deg);
    opacity: 1;
  }
}

.mobile-sub-links {
  list-style: none;
  padding: 0 0 8px 12px;
  margin: 0;
  li {
    margin: 0;
  }
  a {
    display: block;
    padding: 8px 4px;
    font-size: 14px;
    color: #24245b;
    text-decoration: none;
    transition: color 0.15s;
    &:hover {
      color: #8300bf;
    }
    &.active {
      color: #8300bf;
    }
  }
}

.mobile-util-links {
  list-style: none;
  padding: 0;
  margin: 0;
  li {
    margin: 0;
  }
  a {
    display: block;
    padding: 8px 4px;
    font-size: 13px;
    color: #606266;
    text-decoration: none;
    &:hover { color: #24245b; }
  }
  .sign-in-link {
    cursor: pointer;
  }
}

.mobile-signin-btn {
  font-size: 16px;
  color: #24245b;
  background: none;
  border: 1px solid #24245b;
  border-radius: 7px;
  padding: 5px 12px;
  cursor: pointer;
  font-family: inherit;
  transition: color 0.15s, background 0.15s, border-color 0.15s;
  &:hover {
    color: #8300bf;
    background: #f9f2fc;
    border-color: #8300bf;
  }
}

.mobile-social {
  display: flex;
  flex-direction: row;
  gap: 1rem;
  margin-top: auto;
  padding-top: 1.5rem;
}

.social-icon {
  color: #606266;
  font-size: 1.5rem;
  &:hover { color: #24245b; }
}

</style>
