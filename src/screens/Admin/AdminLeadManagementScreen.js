import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal, Switch, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminApi } from '../../services/adminApi';

const AdminLeadManagementScreen = ({ navigation, route }) => {
    const { branchId } = route.params || {}; // Get branchId from navigation params
    const [selectedLead, setSelectedLead] = useState(null);
    const [detailsPanelVisible, setDetailsPanelVisible] = useState(false);
    const [addLeadModalVisible, setAddLeadModalVisible] = useState(false);
    const [demoModalVisible, setDemoModalVisible] = useState(false); // Modal for assigning trainer

    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    const [leads, setLeads] = useState([]);
    const [trainers, setTrainers] = useState([]); // List of trainers for assignment
    const [selectedTrainerId, setSelectedTrainerId] = useState(null); // Selected trainer for assignment
    const [isLoading, setIsLoading] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    // Logs & Lost Reason
    const [logs, setLogs] = useState([]);
    const [logModalVisible, setLogModalVisible] = useState(false);
    const [lostModalVisible, setLostModalVisible] = useState(false);
    const [logNote, setLogNote] = useState('');
    const [lostReason, setLostReason] = useState('');

    // New Lead State
    const [newLead, setNewLead] = useState({ name: '', phone: '', email: '', source: 'Website', status: 'New', notes: '', address: '' });

    useEffect(() => {
        fetchLeads();
        fetchTrainers();
    }, []);

    const fetchLeads = async () => {
        setIsLoading(true);
        try {
            const data = await adminApi.getLeads(branchId);
            setLeads(data || []);
        } catch (error) {
            console.error("Failed to fetch leads:", error);
            // Alert.alert("Error", "Failed to load leads");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchLogs = async (leadId) => {
        try {
            const data = await adminApi.fetchLeadLogs(leadId);
            setLogs(data || []);
        } catch (error) {
            console.error("Failed to fetch logs", error);
            setLogs([]);
        }
    };

    const fetchTrainers = async () => {
        try {
            const users = await adminApi.getUsers(branchId);
            if (users) {
                const trainerList = users.filter(u => u.role === 'trainer' || u.role === 'Trainer');
                setTrainers(trainerList);
            }
        } catch (error) {
            console.error("Failed to fetch trainers", error);
        }
    };

    const handleAddLead = async () => {
        if (!newLead.name || !newLead.phone) {
            Alert.alert("Error", "Name and Phone are required.");
            return;
        }

        try {
            setIsLoading(true);
            const createdLead = await adminApi.createLead(newLead, branchId);
            setLeads([createdLead, ...leads]);
            setAddLeadModalVisible(false);
            setNewLead({ name: '', phone: '', email: '', source: 'Website', status: 'New', notes: '' });
            Alert.alert("Success", "Lead added successfully");
        } catch (error) {
            Alert.alert("Error", "Failed to add lead");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateStatus = async (leadId, newStatus, extraUpdates = {}) => {
        setIsUpdating(true);
        try {
            const updatedLead = await adminApi.updateLead({ id: leadId, status: newStatus, ...extraUpdates }, branchId);
            setLeads(leads.map(l => l.id === leadId ? { ...l, ...updatedLead } : l));
            if (selectedLead && selectedLead.id === leadId) {
                setSelectedLead({ ...selectedLead, ...updatedLead });
            }
            Alert.alert("Success", `Lead status updated to ${newStatus}`);
        } catch (error) {
            console.error("Update failed", error);
            Alert.alert("Error", "Failed to update lead status");
        } finally {
            setIsUpdating(false);
            setDemoModalVisible(false);
            setLostModalVisible(false);
            setDetailsPanelVisible(false); // Close panel on success usually better UX
        }
    };

    const handleAddLog = async () => {
        if (!logNote.trim()) return;
        try {
            await adminApi.addLeadLog({ lead_id: selectedLead.id, note: logNote, type: 'Note' });
            setLogNote('');
            setLogModalVisible(false);
            fetchLogs(selectedLead.id);
        } catch (error) {
            Alert.alert("Error", "Failed to add log");
        }
    };

    const handleConfirmLost = () => {
        if (!lostReason.trim()) {
            Alert.alert("Required", "Please provide a reason.");
            return;
        }
        handleUpdateStatus(selectedLead.id, 'Lost', { lost_reason: lostReason });
    };

    const handleMoveToDemo = () => {
        setDemoModalVisible(true);
        setDetailsPanelVisible(false); // Switch modals
    };

    // ... confirmMoveToDemo ...

    const confirmMoveToDemo = () => {
        if (!selectedLead) return;
        // Proceed even if no trainer selected (optional)
        handleUpdateStatus(selectedLead.id, 'Demo', { assigned_trainer_id: selectedTrainerId });
    };

    const handleConvertToMember = () => {
        setDetailsPanelVisible(false);
        navigation.navigate('AdminUserOnboarding', {
            prefill: {
                name: selectedLead.name,
                phone: selectedLead.phone,
                email: selectedLead.email,
                role: 'Member'
            },
            leadId: selectedLead.id // To potentially close/convert lead after user creation
        });
    };

    // Calculate funnel counts dynamically
    const getStageCount = (status) => leads.filter(l => l.status === status).length;

    const funnelStages = [
        { name: 'New Inquiries', count: getStageCount('New'), color: '#3182CE' },
        { name: 'Demo Booked', count: getStageCount('Demo'), color: '#805AD5' },
        { name: 'Converted', count: getStageCount('Converted'), color: '#38A169' },
        { name: 'Lost', count: getStageCount('Lost'), color: '#E53E3E' },
    ];

    const handleLeadClick = (lead) => {
        setSelectedLead(lead);
        setSelectedTrainerId(lead.assigned_trainer_id || null);
        setLogs([]);
        fetchLogs(lead.id);
        setDetailsPanelVisible(true);
    };

    const getStatusColor = (status) => {
        const colors = { 'New': '#3182CE', 'Demo': '#805AD5', 'Converted': '#38A169', 'Lost': '#E53E3E' };
        return colors[status] || '#718096';
    };

    const filteredLeads = leads.filter(lead => {
        const matchesSearch = (lead.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || (lead.phone || '').includes(searchQuery);
        const matchesStatus = filterStatus === 'All' || lead.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const getTrainerName = (id) => {
        const t = trainers.find(tr => tr.id === id);
        return t ? t.full_name : 'Unassigned';
    };

    return (
        <View style={styles.container}>
            <ScrollView style={styles.mainContent}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.pageTitle}>Lead Management</Text>
                        <Text style={styles.pageSubtitle}>Track inquiries, manage demos, and convert leads.</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <TouchableOpacity style={styles.outlineButton} onPress={fetchLeads}>
                            <Ionicons name="refresh" size={18} color="#4A5568" />
                            <Text style={styles.outlineButtonText}>Refresh</Text>
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
                            placeholder="Search leads..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                    <View style={styles.filterGroup}>
                        {['All', 'New', 'Demo', 'Converted', 'Lost'].map(status => (
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
                        <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Actions</Text>
                    </View>
                    {isLoading ? (
                        <ActivityIndicator size="large" color="#3182CE" style={{ padding: 40 }} />
                    ) : filteredLeads.length === 0 ? (
                        <View style={{ padding: 40, alignItems: 'center' }}>
                            <Ionicons name="funnel-outline" size={48} color="#CBD5E0" />
                            <Text style={{ marginTop: 16, color: '#718096' }}>No leads found.</Text>
                        </View>
                    ) : filteredLeads.map(lead => (
                        <TouchableOpacity key={lead.id} style={styles.tableRow} onPress={() => handleLeadClick(lead)}>
                            <Text style={[styles.tableCell, { flex: 2, fontWeight: '500' }]}>{lead.name}</Text>
                            <View style={[styles.tableCell, { flex: 2 }]}>
                                <Text style={{ fontSize: 13, color: '#2D3748' }}>{lead.phone}</Text>
                                <Text style={{ fontSize: 12, color: '#718096' }}>{lead.email}</Text>
                            </View>
                            <Text style={[styles.tableCell, { flex: 1 }]}>{lead.source}</Text>
                            <Text style={[styles.tableCell, { flex: 1.5, color: '#718096', fontStyle: lead.assigned_trainer_name ? 'normal' : 'italic' }]}>
                                {lead.assigned_trainer_name || 'Unassigned'}
                            </Text>

                            <View style={[styles.tableCell, { flex: 1 }]}>
                                <View style={[styles.statusChip, { backgroundColor: getStatusColor(lead.status) + '20' }]}>
                                    <Text style={[styles.statusChipText, { color: getStatusColor(lead.status) }]}>{lead.status}</Text>
                                </View>
                            </View>

                            <View style={[styles.tableCell, { flex: 1, flexDirection: 'row', gap: 8 }]}>
                                <TouchableOpacity onPress={() => handleLeadClick(lead)}>
                                    <Ionicons name="create-outline" size={20} color="#718096" />
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    ))}
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
                                        <Text style={styles.panelLabel}>Status</Text>
                                        <Text style={{ ...styles.panelValue, color: getStatusColor(selectedLead.status), fontWeight: 'bold' }}>{selectedLead.status}</Text>
                                        <Text style={styles.panelLabel}>Assigned Trainer</Text>
                                        <Text style={styles.panelValue}>{getTrainerName(selectedLead.assigned_trainer_id)}</Text>
                                        <Text style={styles.panelLabel}>Address</Text>
                                        <Text style={styles.panelValue}>{selectedLead.address || '-'}</Text>

                                        {selectedLead.lost_reason && (
                                            <>
                                                <Text style={styles.panelLabel}>Lost Reason</Text>
                                                <Text style={[styles.panelValue, { color: '#E53E3E' }]}>{selectedLead.lost_reason}</Text>
                                            </>
                                        )}
                                    </View>

                                    <View style={styles.panelSection}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                            <Text style={styles.panelSectionTitle}>Interaction History</Text>
                                            <TouchableOpacity onPress={() => setLogModalVisible(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                <Ionicons name="add-circle-outline" size={20} color="#3182CE" />
                                                <Text style={{ color: '#3182CE', fontWeight: '600' }}>Add Log</Text>
                                            </TouchableOpacity>
                                        </View>

                                        {logs.length === 0 && <Text style={{ color: '#A0AEC0', fontStyle: 'italic' }}>No interactions logged.</Text>}

                                        {logs.map(log => (
                                            <View key={log.id} style={styles.timelineItem}>
                                                <View style={styles.timelineDot} />
                                                <View style={styles.timelineContent}>
                                                    <Text style={styles.timelineText}>{log.note}</Text>
                                                    <Text style={styles.timelineTime}>{new Date(log.created_at).toLocaleString()}</Text>
                                                </View>
                                            </View>
                                        ))}

                                        <View style={[styles.timelineItem, { opacity: 0.7 }]}>
                                            <View style={[styles.timelineDot, { backgroundColor: '#CBD5E0' }]} />
                                            <View style={styles.timelineContent}>
                                                <Text style={styles.timelineText}>Lead Created</Text>
                                                <Text style={styles.timelineTime}>{new Date(selectedLead.created_at).toLocaleDateString()}</Text>
                                            </View>
                                        </View>
                                    </View>

                                    <View style={styles.panelActions}>
                                        <TouchableOpacity
                                            style={[styles.panelButton, { backgroundColor: '#805AD5' }]}
                                            onPress={handleMoveToDemo}
                                        >
                                            <Text style={styles.panelButtonText}>Move to Demo / Assign Trainer</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.panelButton, { backgroundColor: '#38A169' }]}
                                            onPress={handleConvertToMember}
                                        >
                                            <Text style={styles.panelButtonText}>Convert to Member</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.panelButton, styles.panelButtonOutline, { borderColor: '#E53E3E' }]}
                                            onPress={() => setLostModalVisible(true)}
                                        >
                                            <Text style={[styles.panelButtonTextOutline, { color: '#E53E3E' }]}>Mark as Lost</Text>
                                        </TouchableOpacity>
                                    </View>
                                </>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Log Interaction Modal */}
            <Modal visible={logModalVisible} animationType="slide" transparent>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{ width: 400, backgroundColor: '#FFF', borderRadius: 12, padding: 24 }}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>Log Interaction/Call</Text>
                        <Text style={styles.label}>Notes</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            multiline numberOfLines={4}
                            value={logNote}
                            onChangeText={setLogNote}
                            placeholder="Details of conversation..."
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelButton} onPress={() => setLogModalVisible(false)}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveButton} onPress={handleAddLog}>
                                <Text style={styles.saveButtonText}>Save Log</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Lost Reason Modal */}
            <Modal visible={lostModalVisible} animationType="slide" transparent>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{ width: 400, backgroundColor: '#FFF', borderRadius: 12, padding: 24 }}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>Mark as Lost</Text>
                        <Text style={styles.label}>Reason for Loss</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            multiline numberOfLines={3}
                            value={lostReason}
                            onChangeText={setLostReason}
                            placeholder="Why was the lead lost?"
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelButton} onPress={() => setLostModalVisible(false)}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.saveButton, { backgroundColor: '#E53E3E' }]} onPress={handleConfirmLost}>
                                <Text style={styles.saveButtonText}>Confirm Lost</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Move to Demo / Assign Trainer Modal */}
            <Modal visible={demoModalVisible} animationType="slide" transparent>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{ width: 400, backgroundColor: '#FFF', borderRadius: 12, padding: 24 }}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>Move to Demo</Text>
                        <Text style={{ marginBottom: 16, color: '#718096' }}>Optionally assign a trainer for the demo session.</Text>

                        <Text style={styles.label}>Select Trainer</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                            {trainers.map(t => (
                                <TouchableOpacity
                                    key={t.id}
                                    style={[styles.sourceOption, selectedTrainerId === t.id && styles.sourceOptionActive]}
                                    onPress={() => setSelectedTrainerId(t.id)}
                                >
                                    <Text style={[styles.sourceText, selectedTrainerId === t.id && styles.sourceTextActive]}>{t.full_name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
                            <TouchableOpacity onPress={() => setDemoModalVisible(false)} style={styles.cancelButton}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={confirmMoveToDemo} style={[styles.saveButton, { backgroundColor: '#805AD5' }]}>
                                <Text style={styles.saveButtonText}>Confirm Demo</Text>
                            </TouchableOpacity>
                        </View>
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

                        <Text style={styles.label}>Address</Text>
                        <TextInput style={styles.input} value={newLead.address} onChangeText={t => setNewLead({ ...newLead, address: t })} placeholder="Enter address" />

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
                                {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Add Lead</Text>}
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
