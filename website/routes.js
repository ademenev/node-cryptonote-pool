import HomeComponent from './pages/Home.vue';
import GettingStartedComponent from './pages/GettingStarted.vue';
import PaymentsComponent from './pages/Payments.vue';
import BlocksComponent from './pages/Blocks.vue';
import SupportComponent from './pages/Support.vue';

export default [
    { path: "", id: "home", icon: "home", title: "Home", component: HomeComponent},
    { path: "getting_started", id: "getting_started", icon: "rocket", title: "Getting started", component: GettingStartedComponent},
    { path: "pool_blocks", id: "pool_blocks", icon: "cubes", title: "Pool Blocks", component: BlocksComponent},
    { path: "payments", id: "payments", icon: "paper-plane-o", title: "Payments", component: PaymentsComponent},
    { path: "support", id: "support", icon: "comments", title: "Support", component: SupportComponent}
];
