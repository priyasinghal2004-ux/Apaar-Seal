/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from '../../store';
import { NavItemKey, Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { AppFooter } from '../common/AppFooter';
import { ToastContainer } from '../common/ToastContainer';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import { SwitchRoleModal } from '../common/SwitchRoleModal';

// Pages
import { OverviewPage } from '../../pages/OverviewPage';
import { ExceptionQueuePage } from '../../pages/ExceptionQueuePage';
import { AdmissionsRegisterPage } from '../../pages/AdmissionsRegisterPage';
import { VerificationPage } from '../../pages/VerificationPage';
import { StudentPortalPage } from '../../pages/StudentPortalPage';
import { IntakeRulesPage } from '../../pages/IntakeRulesPage';
import { AuditLedgerPage } from '../../pages/AuditLedgerPage';
import { TestRunnerPage } from '../../pages/TestRunnerPage';
import { SettingsAdminPage } from '../../pages/SettingsAdminPage';

export const AppLayout: React.FC = () => {
  const { currentUser } = useStore();
  const [activeNav, setActiveNav] = useState<NavItemKey>('overview');
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [selectedInstitutionFilter, setSelectedInstitutionFilter] = useState<string | null>(null);

  // Modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSwitchRoleOpen, setIsSwitchRoleOpen] = useState(false);

  const handleSelectCase = (caseId: string) => {
    setActiveCaseId(caseId);
    setActiveNav('exceptions');
  };

  const handleSelectAdmission = (admissionId: string) => {
    setActiveNav('admissions');
  };

  const handleFilterInstitution = (instId: string) => {
    setSelectedInstitutionFilter(instId);
    setActiveNav('admissions');
  };

  const renderActiveView = () => {
    switch (activeNav) {
      case 'overview':
        return <OverviewPage onNavigate={setActiveNav} onFilterInstitution={handleFilterInstitution} />;
      case 'exceptions':
        return <ExceptionQueuePage initialCaseId={activeCaseId} />;
      case 'admissions':
        return (
          <AdmissionsRegisterPage
            initialInstitutionId={selectedInstitutionFilter || undefined}
            onSelectAdmission={handleSelectAdmission}
            onSelectCase={handleSelectCase}
          />
        );
      case 'verify_record':
        return <VerificationPage />;
      case 'student_portal':
        return <StudentPortalPage />;
      case 'intake_rules':
        return <IntakeRulesPage />;
      case 'audit_ledger':
        return <AuditLedgerPage />;
      case 'test_runner':
        return <TestRunnerPage />;
      case 'settings':
        return <SettingsAdminPage />;
      default:
        return <OverviewPage onNavigate={setActiveNav} onFilterInstitution={handleFilterInstitution} />;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-sans-ui flex flex-col">
      {/* Fixed Sidebar */}
      <Sidebar
        activeNav={activeNav}
        onNavigate={(key) => {
          setActiveNav(key);
          if (key !== 'exceptions') {
            setActiveCaseId(null);
          }
        }}
      />

      {/* Top Bar */}
      <TopBar
        activeNav={activeNav}
        activeCaseId={activeCaseId}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenSwitchRole={() => setIsSwitchRoleOpen(true)}
      />

      {/* Main Content Area */}
      <div className="ml-[244px] pt-14 flex-1 flex flex-col min-h-screen bg-[var(--paper)]">
        <main className="flex-1 p-8 max-w-[1440px] w-full mx-auto">
          {renderActiveView()}
        </main>
        <AppFooter />
      </div>

      {/* Global Modals & Notifications */}
      <ToastContainer />
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectAdmission={handleSelectAdmission}
        onSelectCase={handleSelectCase}
      />
      <SwitchRoleModal
        isOpen={isSwitchRoleOpen}
        onClose={() => setIsSwitchRoleOpen(false)}
      />
    </div>
  );
};
