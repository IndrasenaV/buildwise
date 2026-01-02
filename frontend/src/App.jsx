import { Routes, Route, Link as RouterLink, useNavigate } from 'react-router-dom'
import HomeList from './pages/HomeList.jsx'
import HomeDetail from './pages/HomeDetail.jsx'
import Onboarding from './pages/Onboarding.jsx'
import Auth from './pages/Auth.jsx'
import SideNavLayout from './layouts/SideNavLayout.jsx'
import { Navigate } from 'react-router-dom'
import HomeDocuments from './pages/HomeDocuments.jsx'
import HomeContacts from './pages/HomeContacts.jsx'
import HomeSchedule from './pages/HomeSchedule.jsx'
import HomeTrades from './pages/HomeTrades.jsx'
import HomeBidDetail from './pages/HomeBidDetail.jsx'
import HomeBudget from './pages/HomeBudget.jsx'
import HomeDashboard from './pages/HomeDashboard.jsx'
import HomePermits from './pages/HomePermits.jsx'
import Templates from './pages/Templates.jsx'
import HomeMessages from './pages/HomeMessages.jsx'
import TemplateEditor from './pages/TemplateEditor.jsx'
import Terms from './pages/Terms.jsx'
import Account from './pages/Account.jsx'
import HomePlanning from './pages/HomePlanning.jsx'
import PlanningArchitect from './pages/PlanningArchitect.jsx'
import PlanningArchitectAnalysis from './pages/PlanningArchitectAnalysis.jsx'
import PlanningArchitectInterview from './pages/PlanningArchitectInterview.jsx'
import HomeTools from './pages/HomeTools.jsx'
import Prompts from './pages/Prompts.jsx'
import PlanningFlooring from './pages/PlanningFlooring.jsx'
import PlanningWindowsDoors from './pages/PlanningWindowsDoors.jsx'
import PlanningAppliances from './pages/PlanningAppliances.jsx'
import PlanningCabinets from './pages/PlanningCabinets.jsx'
import PlanningKnowledge from './pages/PlanningKnowledge.jsx'
import Knowledge from './pages/Knowledge.jsx'
import PlanningElectrical from './pages/PlanningElectrical.jsx'
import PlanningPlumbing from './pages/PlanningPlumbing.jsx'
import PlanningDrywallPaint from './pages/PlanningDrywallPaint.jsx'
import PlanningHVAC from './pages/PlanningHVAC.jsx'
import PlanningInsulation from './pages/PlanningInsulation.jsx'
import PlanningExteriorMaterials from './pages/PlanningExteriorMaterials.jsx'
import PlanningCountertops from './pages/PlanningCountertops.jsx'
import TradeBudget from './pages/TradeBudget.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Auth />} />
      <Route path="/terms" element={<Terms />} />
      <Route element={<SideNavLayout />}>
        <Route path="/account" element={<Account />} />
        <Route path="/homes" element={<HomeList />} />
        <Route path="/homes/:id" element={<Navigate to="dashboard" replace />} />
        <Route path="/homes/:id/dashboard" element={<HomeDashboard />} />
        <Route path="/homes/:id/planning" element={<HomePlanning />} />
        <Route path="/homes/:id/planning/architect" element={<PlanningArchitect />} />
        <Route path="/homes/:id/planning/architect/analysis/:docId" element={<PlanningArchitectAnalysis />} />
        <Route path="/homes/:id/planning/architect/interview" element={<PlanningArchitectInterview />} />
        <Route path="/homes/:id/planning/windows-doors" element={<PlanningWindowsDoors />} />
        <Route path="/homes/:id/planning/appliances" element={<PlanningAppliances />} />
        <Route path="/homes/:id/planning/cabinets" element={<PlanningCabinets />} />
        <Route path="/homes/:id/planning/knowledge" element={<PlanningKnowledge />} />
        <Route path="/homes/:id/planning/flooring" element={<PlanningFlooring />} />
        <Route path="/homes/:id/planning/electrical" element={<PlanningElectrical />} />
        <Route path="/homes/:id/planning/plumbing" element={<PlanningPlumbing />} />
        <Route path="/homes/:id/planning/drywall-paint" element={<PlanningDrywallPaint />} />
        <Route path="/homes/:id/planning/hvac" element={<PlanningHVAC />} />
        <Route path="/homes/:id/planning/insulation" element={<PlanningInsulation />} />
        <Route path="/homes/:id/planning/exterior-materials" element={<PlanningExteriorMaterials />} />
        <Route path="/homes/:id/planning/countertops" element={<PlanningCountertops />} />
        <Route path="/homes/:id/permits" element={<HomePermits />} />
        <Route path="/homes/:id/tools" element={<HomeTools />} />
        <Route path="/homes/:id/:phase" element={<HomeDetail />} />
        <Route path="/homes/:id/trades" element={<HomeTrades />} />
        <Route path="/homes/:id/trades/:bidId" element={<HomeBidDetail />} />
        <Route path="/homes/:id/trades/:bidId/budget" element={<TradeBudget />} />
        <Route path="/homes/:id/documents" element={<HomeDocuments />} />
        <Route path="/homes/:id/contacts" element={<HomeContacts />} />
        <Route path="/homes/:id/schedule" element={<HomeSchedule />} />
        <Route path="/homes/:id/budget" element={<HomeBudget />} />
        <Route path="/homes/:id/messages" element={<HomeMessages />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/templates/:id" element={<TemplateEditor />} />
        <Route path="/prompts" element={<Prompts />} />
        <Route path="/knowledge" element={<Knowledge />} />
      </Route>
    </Routes>
  )
}

export default App


