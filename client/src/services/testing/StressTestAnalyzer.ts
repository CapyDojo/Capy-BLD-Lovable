import { getUnifiedRepository } from '@/services/repositories/unified';

export interface FailureAnalysis {
  category: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  issue: string;
  businessImpact: string;
  technicalCause: string;
  recommendedAction: string;
  urgency: 'IMMEDIATE' | 'WITHIN_24H' | 'WITHIN_WEEK' | 'MONITOR';
}

export class StressTestAnalyzer {
  private repository: any;

  async initialize() {
    this.repository = await getUnifiedRepository('ENTERPRISE');
  }

  async analyzeCurrentSystemState(): Promise<FailureAnalysis[]> {
    await this.initialize();
    const issues: FailureAnalysis[] = [];

    // Check data consistency
    const dataConsistencyIssues = await this.checkDataConsistency();
    issues.push(...dataConsistencyIssues);

    // Check performance bottlenecks
    const performanceIssues = await this.checkPerformanceBottlenecks();
    issues.push(...performanceIssues);

    // Check business rule violations
    const businessRuleIssues = await this.checkBusinessRuleViolations();
    issues.push(...businessRuleIssues);

    // Check scalability concerns
    const scalabilityIssues = await this.checkScalabilityReadiness();
    issues.push(...scalabilityIssues);

    return issues.sort((a, b) => {
      const priorityOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
      return priorityOrder[a.category] - priorityOrder[b.category];
    });
  }

  private async checkDataConsistency(): Promise<FailureAnalysis[]> {
    const issues: FailureAnalysis[] = [];

    try {
      const entities = await this.repository.getAllEntities();
      const ownerships = await this.repository.queryOwnerships({});

      // Check for orphaned ownership records
      const entityIds = new Set(entities.map((e: any) => e.id));
      const orphanedOwnerships = ownerships.filter((o: any) => 
        !entityIds.has(o.ownerEntityId) || !entityIds.has(o.ownedEntityId)
      );

      if (orphanedOwnerships.length > 0) {
        issues.push({
          category: 'HIGH',
          issue: 'Orphaned Ownership Records',
          businessImpact: 'Cap table calculations may be inaccurate, potentially affecting valuations and investor reporting',
          technicalCause: `${orphanedOwnerships.length} ownership records reference deleted entities`,
          recommendedAction: 'Clean up orphaned records and implement referential integrity checks',
          urgency: 'WITHIN_24H'
        });
      }

      // Check for circular ownership (critical for compliance)
      const circularOwnership = await this.detectCircularOwnership(entities, ownerships);
      if (circularOwnership.length > 0) {
        issues.push({
          category: 'CRITICAL',
          issue: 'Circular Ownership Detected',
          businessImpact: 'Violates corporate governance rules, could invalidate legal structures and cause regulatory issues',
          technicalCause: `Found ${circularOwnership.length} circular ownership chains`,
          recommendedAction: 'Immediately break circular ownership chains and implement prevention logic',
          urgency: 'IMMEDIATE'
        });
      }

    } catch (error) {
      issues.push({
        category: 'CRITICAL',
        issue: 'Data Access Failure',
        businessImpact: 'System cannot access core business data, halting all operations',
        technicalCause: `Database access error: ${error}`,
        recommendedAction: 'Check database connection and data store configuration',
        urgency: 'IMMEDIATE'
      });
    }

    return issues;
  }

  private async checkPerformanceBottlenecks(): Promise<FailureAnalysis[]> {
    const issues: FailureAnalysis[] = [];

    try {
      const startTime = performance.now();
      
      // Test cap table generation performance
      const entities = await this.repository.getAllEntities();
      const testEntities = entities.slice(0, Math.min(10, entities.length));
      
      const capTablePromises = testEntities.map((entity: any) => 
        this.repository.getCapTableView(entity.id)
      );
      
      await Promise.all(capTablePromises);
      const duration = performance.now() - startTime;
      
      if (duration > 5000) { // More than 5 seconds for 10 cap tables
        issues.push({
          category: 'HIGH',
          issue: 'Slow Cap Table Generation',
          businessImpact: 'Investors and stakeholders experience delays accessing financial data, affecting decision-making speed',
          technicalCause: `Cap table generation taking ${Math.round(duration)}ms for ${testEntities.length} entities`,
          recommendedAction: 'Optimize database queries and implement caching for frequently accessed cap tables',
          urgency: 'WITHIN_WEEK'
        });
      }

      // Check memory usage
      const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;
      if (memoryUsage > 100 * 1024 * 1024) { // More than 100MB
        issues.push({
          category: 'MEDIUM',
          issue: 'High Memory Usage',
          businessImpact: 'System may become unstable with larger datasets, limiting growth capacity',
          technicalCause: `Current memory usage: ${Math.round(memoryUsage / 1024 / 1024)}MB`,
          recommendedAction: 'Implement data pagination and memory optimization strategies',
          urgency: 'WITHIN_WEEK'
        });
      }

    } catch (error) {
      issues.push({
        category: 'HIGH',
        issue: 'Performance Testing Failed',
        businessImpact: 'Cannot assess system performance, potential for unexpected slowdowns during critical operations',
        technicalCause: `Performance test error: ${error}`,
        recommendedAction: 'Investigate and fix performance testing infrastructure',
        urgency: 'WITHIN_24H'
      });
    }

    return issues;
  }

  private async checkBusinessRuleViolations(): Promise<FailureAnalysis[]> {
    const issues: FailureAnalysis[] = [];

    try {
      const entities = await this.repository.getAllEntities();
      
      // Check for entities without proper incorporation details
      const entitiesWithoutJurisdiction = entities.filter((e: any) => 
        e.type !== 'Individual' && !e.jurisdiction
      );

      if (entitiesWithoutJurisdiction.length > 0) {
        issues.push({
          category: 'MEDIUM',
          issue: 'Missing Corporate Registration Details',
          businessImpact: 'Incomplete corporate records may cause compliance issues during audits or due diligence',
          technicalCause: `${entitiesWithoutJurisdiction.length} corporate entities missing jurisdiction information`,
          recommendedAction: 'Complete corporate registration details for all business entities',
          urgency: 'WITHIN_WEEK'
        });
      }

      // Check for share over-allocation
      const shareClasses = await this.repository.getAllShareClasses?.() || [];
      for (const shareClass of shareClasses) {
        const ownerships = await this.repository.queryOwnerships({ shareClassId: shareClass.id });
        const totalAllocated = ownerships.reduce((sum: number, o: any) => sum + o.shares, 0);
        
        if (totalAllocated > shareClass.totalAuthorizedShares) {
          issues.push({
            category: 'CRITICAL',
            issue: 'Share Over-Allocation',
            businessImpact: 'Legal violation - more shares allocated than authorized, invalidating ownership structure',
            technicalCause: `${totalAllocated} shares allocated vs ${shareClass.totalAuthorizedShares} authorized for ${shareClass.name}`,
            recommendedAction: 'Immediately reconcile share allocations or increase authorized shares through proper corporate resolutions',
            urgency: 'IMMEDIATE'
          });
        }
      }

    } catch (error) {
      issues.push({
        category: 'HIGH',
        issue: 'Business Rule Validation Failed',
        businessImpact: 'Cannot verify compliance with corporate governance rules, risking legal violations',
        technicalCause: `Validation error: ${error}`,
        recommendedAction: 'Fix business rule validation system to ensure compliance monitoring',
        urgency: 'WITHIN_24H'
        });
    }

    return issues;
  }

  private async checkScalabilityReadiness(): Promise<FailureAnalysis[]> {
    const issues: FailureAnalysis[] = [];

    try {
      const entities = await this.repository.getAllEntities();
      const ownerships = await this.repository.queryOwnerships({});

      // Assess current scale
      if (entities.length > 1000) {
        issues.push({
          category: 'MEDIUM',
          issue: 'Large Dataset Performance Risk',
          businessImpact: 'System may slow down as your portfolio grows, affecting user experience and operational efficiency',
          technicalCause: `Currently managing ${entities.length} entities and ${ownerships.length} ownership relationships`,
          recommendedAction: 'Implement database indexing and query optimization for large datasets',
          urgency: 'WITHIN_WEEK'
        });
      }

      // Check for potential concurrency issues
      if (ownerships.length > 500) {
        issues.push({
          category: 'LOW',
          issue: 'Concurrency Scaling Preparation Needed',
          businessImpact: 'Multiple users editing cap tables simultaneously may cause data conflicts',
          technicalCause: `Complex ownership structure with ${ownerships.length} relationships may have race conditions`,
          recommendedAction: 'Implement optimistic locking and conflict resolution for concurrent edits',
          urgency: 'MONITOR'
        });
      }

    } catch (error) {
      // Non-critical for scalability assessment
      console.warn('Scalability check warning:', error);
    }

    return issues;
  }

  private async detectCircularOwnership(entities: any[], ownerships: any[]): Promise<string[]> {
    const circularChains: string[] = [];
    const ownershipMap = new Map();

    // Build ownership graph
    ownerships.forEach(o => {
      if (!ownershipMap.has(o.ownerEntityId)) {
        ownershipMap.set(o.ownerEntityId, []);
      }
      ownershipMap.get(o.ownerEntityId).push(o.ownedEntityId);
    });

    // Detect cycles using DFS
    const visited = new Set();
    const recursionStack = new Set();

    const hasCycle = (entityId: string, path: string[]): boolean => {
      if (recursionStack.has(entityId)) {
        circularChains.push(path.join(' → ') + ' → ' + entityId);
        return true;
      }

      if (visited.has(entityId)) return false;

      visited.add(entityId);
      recursionStack.add(entityId);

      const ownedEntities = ownershipMap.get(entityId) || [];
      for (const ownedId of ownedEntities) {
        if (hasCycle(ownedId, [...path, entityId])) {
          return true;
        }
      }

      recursionStack.delete(entityId);
      return false;
    };

    entities.forEach(entity => {
      if (!visited.has(entity.id)) {
        hasCycle(entity.id, []);
      }
    });

    return circularChains;
  }

  async generateExecutiveSummary(issues: FailureAnalysis[]): Promise<string> {
    const critical = issues.filter(i => i.category === 'CRITICAL');
    const high = issues.filter(i => i.category === 'HIGH');
    const medium = issues.filter(i => i.category === 'MEDIUM');
    const low = issues.filter(i => i.category === 'LOW');

    let summary = `SYSTEM HEALTH ASSESSMENT\n`;
    summary += `========================\n\n`;

    if (critical.length === 0 && high.length === 0) {
      summary += `✅ GOOD NEWS: No critical issues detected. Your system is ready for production use.\n\n`;
    } else {
      summary += `⚠️  ATTENTION REQUIRED: Found ${critical.length + high.length} high-priority issues that need immediate attention.\n\n`;
    }

    summary += `ISSUE BREAKDOWN:\n`;
    summary += `• Critical (Fix Immediately): ${critical.length}\n`;
    summary += `• High Priority (Fix Within 24h): ${high.length}\n`;
    summary += `• Medium Priority (Fix Within Week): ${medium.length}\n`;
    summary += `• Low Priority (Monitor): ${low.length}\n\n`;

    if (critical.length > 0) {
      summary += `🚨 CRITICAL ISSUES (Fix Immediately):\n`;
      critical.forEach((issue, i) => {
        summary += `${i + 1}. ${issue.issue}\n`;
        summary += `   Impact: ${issue.businessImpact}\n`;
        summary += `   Action: ${issue.recommendedAction}\n\n`;
      });
    }

    if (high.length > 0) {
      summary += `⚠️  HIGH PRIORITY ISSUES (Fix Within 24 Hours):\n`;
      high.forEach((issue, i) => {
        summary += `${i + 1}. ${issue.issue}\n`;
        summary += `   Impact: ${issue.businessImpact}\n`;
        summary += `   Action: ${issue.recommendedAction}\n\n`;
      });
    }

    summary += `RECOMMENDED NEXT STEPS:\n`;
    const immediateActions = issues.filter(i => i.urgency === 'IMMEDIATE');
    const within24h = issues.filter(i => i.urgency === 'WITHIN_24H');

    if (immediateActions.length > 0) {
      summary += `1. Address ${immediateActions.length} immediate issue(s) before proceeding\n`;
    }
    if (within24h.length > 0) {
      summary += `${immediateActions.length > 0 ? '2' : '1'}. Schedule ${within24h.length} high-priority fix(es) within 24 hours\n`;
    }
    
    summary += `${immediateActions.length + within24h.length > 0 ? (immediateActions.length > 0 ? '3' : '2') : '1'}. System is suitable for production deployment after addressing priority issues\n`;

    return summary;
  }
}

// Make available globally for console access
if (typeof window !== 'undefined') {
  (window as any).analyzeSystemHealth = async () => {
    const analyzer = new StressTestAnalyzer();
    const issues = await analyzer.analyzeCurrentSystemState();
    const summary = await analyzer.generateExecutiveSummary(issues);
    console.log(summary);
    return { issues, summary };
  };
}