import { createApp, ref, onMounted } from 'vue';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const ADMIN_TOKEN = localStorage.getItem('ADMIN_TOKEN') || '';

const App = {
  setup() {
    const tab = ref('dashboard');
    const adminToken = ref(ADMIN_TOKEN);
    const dash = ref({ projects:[], contributions:[], events:[] });
    const users = ref([]);
    const antennas = ref([]);
    const projects = ref([]);
    const suggests = ref([]);
    const events = ref([]);

    const headers = () => (adminToken.value ? { 'x-admin-token': adminToken.value, 'Content-Type':'application/json' } : {});

    function saveToken() {
      localStorage.setItem('ADMIN_TOKEN', adminToken.value);
      alert('Token sauvegardé. Recharge si besoin.');
    }

    async function loadDashboard() {
      const r = await fetch(`${API}/dashboard`);
      dash.value = await r.json();
    }

    async function loadUsers() {
      const r = await fetch(`${API}/users`, { headers: headers() });
      if (r.ok) users.value = await r.json();
    }

    async function loadAntennas() {
      const r = await fetch(`${API}/antennas`, { headers: headers() });
      if (r.ok) antennas.value = await r.json();
    }

    async function loadProjects() {
      const r = await fetch(`${API}/projects`);
      projects.value = await r.json();
    }

    async function loadSuggests() {
      const r = await fetch(`${API}/project-suggests`, { headers: headers() });
      if (r.ok) suggests.value = await r.json();
    }

    async function loadEvents() {
      const r = await fetch(`${API}/events`);
      events.value = await r.json();
    }

    onMounted(async () => {
      await loadDashboard();
      await loadUsers();
      await loadAntennas();
      await loadProjects();
      await loadSuggests();
      await loadEvents();
    });

    // Minimal forms
    const newUser = ref({ firstName:'', lastName:'', email:'' });
    async function addUser() {
      const r = await fetch(`${API}/users`, { method:'POST', headers: headers(), body: JSON.stringify(newUser.value) });
      if (r.ok) { await loadUsers(); newUser.value = { firstName:'', lastName:'', email:'' }; }
      else alert('Erreur création membre');
    }

    const newAntenna = ref({ name:'' });
    async function addAntenna() {
      const r = await fetch(`${API}/antennas`, { method:'POST', headers: headers(), body: JSON.stringify(newAntenna.value) });
      if (r.ok) { await loadAntennas(); newAntenna.value={ name:'' }; } else alert('Erreur antenne');
    }

    const newProject = ref({ name:'', description:'', slug:'' });
    async function addProject() {
      const r = await fetch(`${API}/projects`, { method:'POST', headers: headers(), body: JSON.stringify(newProject.value) });
      if (r.ok) { await loadProjects(); newProject.value={ name:'', description:'', slug:'' }; } else alert('Erreur projet');
    }

    const newDoc = ref({ title:'', url:'' });
    async function addDoc() {
      const r = await fetch(`${API}/documents`, { method:'POST', headers: headers(), body: JSON.stringify(newDoc.value) });
      if (r.ok) { alert('Document ajouté'); } else alert('Erreur document'); 
    }

    return { tab, adminToken, saveToken, dash, users, projects, antennas, suggests, events, newUser, addUser, newAntenna, addAntenna, newProject, addProject, newDoc, addDoc };
  },
  template: `
  <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto; padding:16px; max-width:1100px; margin:0 auto">
    <h1>Application d'association — Admin</h1>
    <p style="color:#666">Démo conforme au cahier des charges (PDF), backend Express/Prisma (SQLite), frontend Vue minimal.</p>

    <div style="margin: 12px 0;">
      <input v-model="adminToken" placeholder="ADMIN_TOKEN" style="padding:8px; width: 320px;" />
      <button @click="saveToken" style="padding:8px 12px; margin-left:8px;">Enregistrer</button>
    </div>

    <nav style="display:flex; gap:8px; margin:16px 0;">
      <button @click="tab='dashboard'">Dashboard</button>
      <button @click="tab='members'">Membres</button>
      <button @click="tab='antennas'">Antennes</button>
      <button @click="tab='projects'">Projets</button>
      <button @click="tab='events'">Événements</button>
      <button @click="tab='docs'">Documents</button>
      <button @click="tab='suggests'">Propositions</button>
    </nav>

    <section v-if="tab==='dashboard'">
      <h2>Dashboard</h2>
      <h3>Projets en cours (8 derniers)</h3>
      <ul><li v-for="p in dash.projects" :key="p.id">{{p.name}}</li></ul>
      <h3>Cotisations en cours (8 dernières)</h3>
      <ul><li v-for="c in dash.contributions" :key="c.id">{{c.name}}</li></ul>
      <h3>Événements approuvés (8 derniers)</h3>
      <ul><li v-for="e in dash.events" :key="e.id">{{e.title}}</li></ul>
    </section>

    <section v-if="tab==='members'">
      <h2>Membres</h2>
      <div style="margin:8px 0;">
        <input v-model="newUser.firstName" placeholder="Prénom" />
        <input v-model="newUser.lastName" placeholder="Nom" />
        <input v-model="newUser.email" placeholder="Email" />
        <button @click="addUser">Créer</button>
      </div>
      <table border="1" cellpadding="6">
        <thead><tr><th>#</th><th>Nom</th><th>Email</th><th>Antenne</th></tr></thead>
        <tbody>
          <tr v-for="u in users" :key="u.id">
            <td>{{u.id}}</td>
            <td>{{u.firstName}} {{u.lastName}}</td>
            <td>{{u.email}}</td>
            <td>{{u.antenna?.name || '-'}}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section v-if="tab==='antennas'">
      <h2>Antennes</h2>
      <div style="margin:8px 0;">
        <input v-model="newAntenna.name" placeholder="Nom antenne" />
        <button @click="addAntenna">Créer</button>
      </div>
      <ul><li v-for="a in antennas" :key="a.id">{{a.name}} — {{a.members.length}} membre(s)</li></ul>
    </section>

    <section v-if="tab==='projects'">
      <h2>Projets</h2>
      <div style="margin:8px 0;">
        <input v-model="newProject.name" placeholder="Nom" />
        <input v-model="newProject.slug" placeholder="Slug unique" />
        <input v-model="newProject.description" placeholder="Description" style="width:360px;" />
        <button @click="addProject">Créer</button>
      </div>
      <ul><li v-for="p in projects" :key="p.id">{{p.name}} — {{p.status}}</li></ul>
    </section>

    <section v-if="tab==='events'">
      <h2>Événements</h2>
      <ul><li v-for="e in events" :key="e.id">{{e.title}} — {{e.approved ? 'approuvé' : 'en attente'}}</li></ul>
    </section>

    <section v-if="tab==='docs'">
      <h2>Documents</h2>
      <div>
        <input v-model="newDoc.title" placeholder="Titre" />
        <input v-model="newDoc.url" placeholder="URL" style="width:360px;" />
        <button @click="addDoc">Ajouter</button>
      </div>
      <p>Astuce: hébergez vos PDF et mettez les URL ici.</p>
    </section>

    <section v-if="tab==='suggests'">
      <h2>Propositions de projets</h2>
      <ul><li v-for="s in suggests" :key="s.id">{{s.name}} — {{s.status}}</li></ul>
    </section>
  </div>
  `
};

createApp(App).mount('#app');