import { createRouter, createWebHistory } from 'vue-router'
import Password from '@/components/Password'
import Witnesses from '@/components/Witnesses'
import Wallet from '@/components/Wallet'
import Page404 from '@/components/Page404'

import HomeExplorer from '@/components/explorer/Home'
import AccountExplorer from '@/components/explorer/Account'
import PostExplorer from '@/components/explorer/Post'
import BlockExplorer from '@/components/explorer/Block'
import TransactionExplorer from '@/components/explorer/Transaction'
import TxExplorer from '@/components/explorer/Tx'

export default createRouter({
  history: createWebHistory(import.meta.env.VITE_ROUTER_BASE || '/'),
  routes: [
    { path: '/', name: 'Home', component: HomeExplorer },
    { path: '/password', name: 'Password', component: Password },
    { path: '/witnesses', name: 'Witnesses', component: Witnesses },
    { path: '/wallet', name: 'Wallet', component: Wallet },
    { path: '/rewardcalc', name: 'RewardCalc', component: () => import('./views/RewardCalcPage.vue') },
    { path: '/broadcast', name: 'Broadcast', component: () => import('./views/BroadcastPage.vue') },
    { path: '/proposals/:id', name: 'Proposal', component: () => import('./views/ProposalPage.vue') },
    { path: '/reports', name: 'Reports', component: () => import('./views/ReportsPage.vue') },
    { path: '/explorer', name: 'Explorer', component: HomeExplorer },
    { path: '/explorer/@:account', name: 'Account', component: AccountExplorer },
    { path: '/explorer/@:account/:permlink', name: 'Post', component: PostExplorer },
    { path: '/explorer/b/:id', name: 'Block', component: BlockExplorer },
    { path: '/explorer/b/:id/:tx', name: 'Transaction', component: TransactionExplorer },
    { path: '/explorer/tx/:tx', name: 'TX explorer', component: TxExplorer },
    { path: '/:pathMatch(.*)*', name: 'Page404', component: Page404 },
  ],
})
