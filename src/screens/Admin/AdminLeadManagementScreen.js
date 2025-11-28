import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AdminLeadManagementScreen = ({ navigation }) => {
    const [selectedLead, setSelectedLead] = useState(null);
    const [detailsPanelVisible, setDetailsPanelVisible] = useState(false);
    const [addLeadModalVisible, setAddLeadModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterSource, setFilterSource] = useState('All');

    const [leads, setLeads] = useState([
        { id: '1', name: 'John Smith', phone: '+1 555-0123', email: 'john@email.com', source: 'Website', trainer: 'Mike Johnson', status: 'New', lastActivity: '2024-01-15', score: 85 },
        { id: '2', name: 'Sarah Williams', phone: '+1 555-0124', email: 'sarah@email.com', source: 'Instagram', trainer: 'Lisa Chen', status: 'Contacted', lastActivity: '2024-01-14', score: 72 },
        { id: '3', name: 'Mike Brown', phone: '+1 555-0125', email: 'mike@email.com', source: 'Walk-in', trainer: 'Unassigned', status: 'Follow-up', lastActivity: '2024-01-13', score: 90 },
        { id: '4', name: 'Emma Davis', phone: '+1 555-0126', email: 'emma@email.com', source: 'Referral', trainer: 'Mike Johnson', status: 'Trial Booked', lastActivity: '2024-01-12', score: 95 },
    ]);

    const [newLead, setNewLead] = useState({ name: '', phone: '', email: '', source: 'Website', trainer: 'Unassigned', status: 'New', notes: '' });
    const [automations, setAutomations] = useState({ welcome: true, autoAssign: false, followUp: true, scoring: true });

    const funnelStages = [
        { name: 'New Inquiries', count: 24, conversion: '100%', color: '#3182CE' },
        { name: 'Contacted', count: 18, conversion: '75%', color: '#805AD5' },
        { name: 'Follow-up', count: 12, conversion: '50%', color: '#D69E2E' },
        { name: 'Trial Booked', count: 8, conversion: '33%', color: '#38A169' },
        { name: 'Converted', count: 5, conversion: '21%', color: '#22543D' },
    ];

    const handleLeadClick = (lead) => {
        setSelectedLead(lead);
        setDetailsPanelVisible(true);
    };

    const handleAddLead = () => {
        setLeads([...leads, { ...newLead, id: Date.now().toString(), lastActivity: new Date().toISOString().split('T')[0], score: 50 }]);
        setAddLeadModalVisible(false);
        setNewLead({ name: '', phone: '', email: '', source: 'Website', trainer: 'Unassigned', status: 'New', notes: '' });
    };

    const getStatusColor = (status) => {
        const colors = { 'New': '#3182CE', 'Contacted': '#805AD5', 'Follow-up': '#D69E2E', 'Trial Booked': '#38A169', 'Converted': '#22543D', 'Lost': '#E53E3E' };
        return colors[status] || '#718096';
    };

    const filteredLeads = leads.filter(lead => {
        const matchesSearch = lead.name.toLowerCase().includes(searchQuery.toLowerCase()) || lead.phone.includes(searchQuery);
        const matchesStatus = filterStatus === 'All' || lead.status === filterStatus;
        const matchesSource = filterSource === 'All' || lead.source === filterSource;
        return matchesSearch && matchesStatus && matchesSource;
    });

    return (
        <View style={styles.container}>
            <ScrollView style={styles.mainContent}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.pageTitle}>Lead Management</Text>
                        <Text style={styles.pageSubtitle}>Track inquiries, manage follow-ups, and convert leads to members.</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <TouchableOpacity style={styles.outlineButton}>
                            <Ionicons name="cloud-upload-outline" size={18} color="#4A5568" />
                            <Text style={styles.outlineButtonText}>Import</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.primaryButton} onPress={() => setAddLeadModalVisible(true)}>
                            <Ionicons name="add" size={20} color="#FFF" />
                            <Text style={styles.primaryButtonText}>Add Lead</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Funnel Overview */}
                <View style={styles.funnelContainer}>
                    {funnelStages.map((stage, i) => (
                        <View key={i} style={styles.funnelStage}>
                            <View style={[styles.funnelBlock, { backgroundColor: stage.color }]}>
                                <Text style={styles.funnelCount}>{stage.count}</Text>
                                <Text style={styles.funnelName}>{stage.name}</Text>
                                <Text style={styles.funnelConversion}>{stage.conversion}</Text>
                            </View>
                            {i < funnelStages.length - 1 && <Ionicons name="chevron-forward" size={20} color="#CBD5E0" style={styles.funnelArrow} />}
                        </View>
                    ))}
                </View>

                {/* Filters */}
                <View style={styles.filtersRow}>
                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={18} color="#718096" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search leads by name or phone…"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                    <View style={styles.filterGroup}>
                        {['All', 'New', 'Contacted', 'Follow-up', 'Converted', 'Lost'].map(status => (
                            <TouchableOpacity
                                key={status}
                                style={[styles.filterChip, filterStatus === status && styles.filterChipActive]}
                                onPress={() => setFilterStatus(status)}
                            >
                                <Text style={[styles.filterChipText, filterStatus === status && styles.filterChipTextActive]}>{status}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Lead Table */}
                <View style={styles.tableCard}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Lead Name</Text>
                        <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Contact</Text>
                        <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Source</Text>
                        <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Trainer</Text>
                        <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Status</Text>
                        <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Score</Text>
                        <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Actions</Text>
                    </View>
                    {filteredLeads.map(lead => (
                        <TouchableOpacity key={lead.id} style={styles.tableRow} onPress={() => handleLeadClick(lead)}>
                            <Text style={[styles.tableCell, { flex: 2, fontWeight: lead.score > 80 ? 'bold' : '500' }]}>{lead.name}</Text>
                            <View style={[styles.tableCell, { flex: 2 }]}>
                                <Text style={{ fontSize: 13, color: '#2D3748' }}>{lead.phone}</Text>
                                <Text style={{ fontSize: 12, color: '#718096' }}>{lead.email}</Text>
                            </View>
                            <Text style={[styles.tableCell, { flex: 1 }]}>{lead.source}</Text>
                            <Text style={[styles.tableCell, { flex: 1.5, color: lead.trainer === 'Unassigned' ? '#E53E3E' : '#2D3748' }]}>{lead.trainer}</Text>
                            <View style={[styles.tableCell, { flex: 1 }]}>
                                <View style={[styles.statusChip, { backgroundColor: getStatusColor(lead.status) + '20' }]}>
                                    <Text style={[styles.statusChipText, { color: getStatusColor(lead.status) }]}>{lead.status}</Text>
                                </View>
                            </View>
                            <View style={[styles.tableCell, { flex: 1 }]}>
                                <View style={styles.scoreBar}>
                                    <View style={[styles.scoreFill, { width: `${lead.score}%`, backgroundColor: lead.score > 80 ? '#38A169' : lead.score > 50 ? '#D69E2E' : '#718096' }]} />
                                    <Text style={styles.scoreText}>{lead.score}</Text>
                                </View>
                            </View>
                            <View style={[styles.tableCell, { flex: 1, flexDirection: 'row', gap: 8 }]}>
                                <TouchableOpacity onPress={() => handleLeadClick(lead)}>
                                    <Ionicons name="eye-outline" size={18} color="#3182CE" />
                                </TouchableOpacity>
                                <TouchableOpacity>
                                    <Ionicons name="create-outline" size={18} color="#718096" />
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Analytics */}
                <View style={styles.analyticsGrid}>
                    <View style={styles.analyticsCard}>
                        <Text style={styles.analyticsTitle}>Leads by Source</Text>
                        <View style={styles.analyticsContent}>
                            {['Website', 'Instagram', 'Walk-in', 'Referral'].map(source => (
                                <View key={source} style={styles.analyticsRow}>
                                    <Text style={styles.analyticsLabel}>{source}</Text>
                                    <View style={styles.analyticsBarContainer}>
                                        <View style={[styles.analyticsBar, { width: `${Math.random() * 100}%` }]} />
                                    </View>
                                    <Text style={styles.analyticsValue}>{Math.floor(Math.random() * 50)}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                    <View style={styles.analyticsCard}>
                        <Text style={styles.analyticsTitle}>Automations</Text>
                        <View style={styles.automationsList}>
                            <View style={styles.automationRow}>
                                <Text style={styles.automationLabel}>Auto-send welcome message</Text>
                                <Switch value={automations.welcome} onValueChange={v => setAutomations({ ...automations, welcome: v })} />
                            </View>
                            <View style={styles.automationRow}>
                                <Text style={styles.automationLabel}>Auto-assign trainer</Text>
                                <Switch value={automations.autoAssign} onValueChange={v => setAutomations({ ...automations, autoAssign: v })} />
                            </View>
                            <View style={styles.automationRow}>
                                <Text style={styles.automationLabel}>Auto-create follow-ups</Text>
                                <Switch value={automations.followUp} onValueChange={v => setAutomations({ ...automations, followUp: v })} />
                            </View>
                            <View style={styles.automationRow}>
                                <Text style={styles.automationLabel}>Auto-score leads</Text>
                                <Switch value={automations.scoring} onValueChange={v => setAutomations({ ...automations, scoring: v })} />
                            </View>
                        </View>
                    </View>
                </View>

                {/* Export Tools */}
                <View style={styles.toolsRow}>
                    <TouchableOpacity style={styles.toolButton}>
                        <Ionicons name="download-outline" size={18} color="#4A5568" />
                        <Text style={styles.toolButtonText}>Export CSV</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.toolButton}>
                        <Ionicons name="document-text-outline" size={18} color="#4A5568" />
                        <Text style={styles.toolButtonText}>Download Report</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.toolButton}>
                        <Ionicons name="refresh-outline" size={18} color="#4A5568" />
                        <Text style={styles.toolButtonText}>Refresh</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Details Side Panel */}
            <Modal visible={detailsPanelVisible} animationType="slide" transparent onRequestClose={() => setDetailsPanelVisible(false)}>
                <View style={styles.panelOverlay}>
                    <TouchableOpacity style={styles.panelBackdrop} onPress={() => setDetailsPanelVisible(false)} />
                    <View style={styles.sidePanel}>
                        <View style={styles.panelHeader}>
                            <Text style={styles.panelTitle}>Lead Details</Text>
                            <TouchableOpacity onPress={() => setDetailsPanelVisible(false)}>
                                <Ionicons name="close" size={28} color="#4A5568" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.panelContent}>
                            {selectedLead && (
                                <>
                                    <View style={styles.panelSection}>
                                        <Text style={styles.panelSectionTitle}>Contact Information</Text>
                                        <Text style={styles.panelLabel}>Name</Text>
                                        <Text style={styles.panelValue}>{selectedLead.name}</Text>
                                        <Text style={styles.panelLabel}>Phone</Text>
                                        <Text style={styles.panelValue}>{selectedLead.phone}</Text>
                                        <Text style={styles.panelLabel}>Email</Text>
                                        <Text style={styles.panelValue}>{selectedLead.email}</Text>
                                        <Text style={styles.panelLabel}>Source</Text>
                                        <Text style={styles.panelValue}>{selectedLead.source}</Text>
                                        <Text style={styles.panelLabel}>Lead Score</Text>
                                        <Text style={[styles.panelValue, { fontSize: 24, fontWeight: 'bold', color: '#3182CE' }]}>{selectedLead.score}/100</Text>
                                    </View>

                                    <View style={styles.panelSection}>
                                        <Text style={styles.panelSectionTitle}>Activity Timeline</Text>
                                        {['Inquiry created', 'Contacted via phone', 'Follow-up scheduled', 'Trainer assigned'].map((activity, i) => (
                                            <View key={i} style={styles.timelineItem}>
                                                <View style={styles.timelineDot} />
                                                <View style={styles.timelineContent}>
                                                    <Text style={styles.timelineText}>{activity}</Text>
                                                    <Text style={styles.timelineTime}>{selectedLead.lastActivity}</Text>
                                                </View>
                                            </View>
                                        ))}
                                    </View>

                                    <View style={styles.panelActions}>
                                        <TouchableOpacity style={styles.panelButton}>
                                            <Text style={styles.panelButtonText}>Convert to Member</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[styles.panelButton, styles.panelButtonOutline]}>
                                            <Text style={styles.panelButtonTextOutline}>Mark as Lost</Text>
                                        </TouchableOpacity>
                                    </View>
                                </>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Add Lead Modal */}
            <Modal visible={addLeadModalVisible} animationType="slide" onRequestClose={() => setAddLeadModalVisible(false)}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Add New Lead</Text>
                        <TouchableOpacity onPress={() => setAddLeadModalVisible(false)}>
                            <Ionicons name="close" size={28} color="#4A5568" />
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.modalContent}>
                        <Text style={styles.label}>Name</Text>
                        <TextInput style={styles.input} value={newLead.name} onChangeText={t => setNewLead({ ...newLead, name: t })} />
                        <Text style={styles.label}>Phone</Text>
                        <TextInput style={styles.input} value={newLead.phone} onChangeText={t => setNewLead({ ...newLead, phone: t })} />
                        <Text style={styles.label}>Email</Text>
                        <TextInput style={styles.input} value={newLead.email} onChangeText={t => setNewLead({ ...newLead, email: t })} />
                        <Text style={styles.label}>Lead Source</Text>
                        <View style={styles.sourceSelector}>
                            {['Website', 'Instagram', 'Walk-in', 'Referral', 'Campaign'].map(source => (
                                <TouchableOpacity
                                    key={source}
                                    style={[styles.sourceOption, newLead.source === source && styles.sourceOptionActive]}
                                    onPress={() => setNewLead({ ...newLead, source })}
                                >
                                    <Text style={[styles.sourceText, newLead.source === source && styles.sourceTextActive]}>{source}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Text style={styles.label}>Notes</Text>
                        <TextInput style={[styles.input, styles.textArea]} multiline numberOfLines={4} value={newLead.notes} onChangeText={t => setNewLead({ ...newLead, notes: t })} />
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelButton} onPress={() => setAddLeadModalVisible(false)}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveButton} onPress={handleAddLead}>
                                <Text style={styles.saveButtonText}>Add Lead</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7FAFC' },
    mainContent: { flex: 1, padding: 24 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
    pageTitle: { fontSize: 28, fontWeight: 'bold', color: '#1A202C', marginBottom: 4 },
    pageSubtitle: { fontSize: 16, color: '#718096' },
    primaryButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3182CE', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, gap: 8 },
    primaryButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    outlineButton: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, gap: 8 },
    outlineButtonText: { color: '#4A5568', fontWeight: '600', fontSize: 15 },

    funnelContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, gap: 8 },
    funnelStage: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    funnelBlock: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
    funnelCount: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 4 },
    funnelName: { fontSize: 12, color: '#FFF', marginBottom: 2, textAlign: 'center' },
    funnelConversion: { fontSize: 11, color: '#FFF', opacity: 0.8 },
    funnelArrow: { marginHorizontal: 4 },

    filtersRow: { marginBottom: 24 },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 12 },
    searchInput: { flex: 1, padding: 10, fontSize: 15 },
    filterGroup: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    filterChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0' },
    filterChipActive: { backgroundColor: '#3182CE', borderColor: '#3182CE' },
    filterChipText: { fontSize: 13, color: '#4A5568' },
    filterChipTextActive: { color: '#FFF', fontWeight: '600' },

    tableCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, marginBottom: 24 },
    tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 12, marginBottom: 12 },
    tableHeaderCell: { fontSize: 13, fontWeight: '600', color: '#4A5568', textTransform: 'uppercase' },
    tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F7FAFC' },
    tableCell: { fontSize: 14, color: '#2D3748' },
    statusChip: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, alignSelf: 'flex-start' },
    statusChipText: { fontSize: 12, fontWeight: '600' },
    scoreBar: { position: 'relative', height: 24, backgroundColor: '#F7FAFC', borderRadius: 12, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
    scoreFill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 12 },
    scoreText: { fontSize: 12, fontWeight: 'bold', color: '#2D3748', zIndex: 1 },

    analyticsGrid: { flexDirection: 'row', gap: 24, marginBottom: 24 },
    analyticsCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 12, padding: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    analyticsTitle: { fontSize: 18, fontWeight: 'bold', color: '#2D3748', marginBottom: 16 },
    analyticsContent: { gap: 12 },
    analyticsRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    analyticsLabel: { fontSize: 14, color: '#4A5568', width: 80 },
    analyticsBarContainer: { flex: 1, height: 8, backgroundColor: '#F7FAFC', borderRadius: 4, overflow: 'hidden' },
    analyticsBar: { height: '100%', backgroundColor: '#3182CE', borderRadius: 4 },
    analyticsValue: { fontSize: 14, fontWeight: 'bold', color: '#2D3748', width: 30, textAlign: 'right' },
    automationsList: { gap: 16 },
    automationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    automationLabel: { fontSize: 15, color: '#2D3748' },

    toolsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    toolButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, gap: 8, borderWidth: 1, borderColor: '#E2E8F0' },
    toolButtonText: { fontSize: 14, fontWeight: '600', color: '#4A5568' },

    panelOverlay: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end' },
    panelBackdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
    sidePanel: { width: 400, backgroundColor: '#FFF', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, elevation: 5 },
    panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    panelTitle: { fontSize: 24, fontWeight: 'bold', color: '#1A202C' },
    panelContent: { flex: 1, padding: 24 },
    panelSection: { marginBottom: 32 },
    panelSectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2D3748', marginBottom: 16 },
    panelLabel: { fontSize: 13, fontWeight: '600', color: '#718096', marginTop: 12, marginBottom: 4 },
    panelValue: { fontSize: 16, color: '#2D3748' },
    timelineItem: { flexDirection: 'row', marginBottom: 16 },
    timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#3182CE', marginTop: 4, marginRight: 12 },
    timelineContent: { flex: 1 },
    timelineText: { fontSize: 14, color: '#2D3748', marginBottom: 2 },
    timelineTime: { fontSize: 12, color: '#718096' },
    panelActions: { gap: 12, marginTop: 24 },
    panelButton: { backgroundColor: '#3182CE', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
    panelButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    panelButtonOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#E2E8F0' },
    panelButtonTextOutline: { color: '#4A5568', fontWeight: '600', fontSize: 16 },

    modalContainer: { flex: 1, backgroundColor: '#FFF' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#1A202C' },
    modalContent: { flex: 1, padding: 24 },
    label: { fontSize: 14, fontWeight: '600', color: '#4A5568', marginTop: 16, marginBottom: 8 },
    input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#FFF' },
    textArea: { height: 100, textAlignVertical: 'top' },
    sourceSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    sourceOption: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFF' },
    sourceOptionActive: { backgroundColor: '#EBF8FF', borderColor: '#3182CE' },
    sourceText: { fontSize: 14, color: '#4A5568' },
    sourceTextActive: { color: '#3182CE', fontWeight: '600' },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 32, marginBottom: 24 },
    cancelButton: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
    cancelButtonText: { color: '#4A5568', fontWeight: '600' },
    saveButton: { backgroundColor: '#3182CE', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
    saveButtonText: { color: '#FFF', fontWeight: 'bold' },
});

export default AdminLeadManagementScreen;
