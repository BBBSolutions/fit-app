import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal, FlatList, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AdminContentManagerScreen = ({ navigation }) => {
    const [activeTab, setActiveTab] = useState('All Content');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [editorVisible, setEditorVisible] = useState(false);
    const [bannerModalVisible, setBannerModalVisible] = useState(false);
    const [currentContent, setCurrentContent] = useState(null);

    const [contentItems, setContentItems] = useState([
        { id: '1', title: 'Welcome to FitPlatform', type: 'Page', status: 'Published', updated: '2024-01-15', author: 'Admin', thumbnail: '📄' },
        { id: '2', title: 'Spring Fitness Challenge', type: 'Article', status: 'Published', updated: '2024-01-10', author: 'Admin', thumbnail: '📝' },
        { id: '3', title: 'New Year Promotion', type: 'Announcement', status: 'Published', updated: '2024-01-01', author: 'Admin', thumbnail: '📢' },
        { id: '4', title: 'Hero Banner - Join Now', type: 'Banner', status: 'Published', updated: '2023-12-28', author: 'Admin', thumbnail: '🖼️' },
        { id: '5', title: 'HIIT Workout Guide', type: 'Workout Guide', status: 'Draft', updated: '2023-12-20', author: 'Trainer', thumbnail: '💪' },
        { id: '6', title: 'Privacy Policy', type: 'Legal', status: 'Published', updated: '2023-12-01', author: 'Admin', thumbnail: '⚖️' },
    ]);

    const tabs = ['All Content', 'Pages', 'Articles', 'Announcements', 'Banners', 'Legal', 'Workout Guides'];

    const handleNewContent = () => {
        setCurrentContent({ title: '', type: 'Page', status: 'Draft', content: '', tags: [], metaTitle: '', metaDescription: '', slug: '' });
        setEditorVisible(true);
    };

    const handleEditContent = (item) => {
        setCurrentContent({ ...item, content: '', tags: [], metaTitle: '', metaDescription: '', slug: '' });
        setEditorVisible(true);
    };

    const handleSaveContent = () => {
        if (currentContent.id) {
            setContentItems(contentItems.map(item => item.id === currentContent.id ? { ...item, ...currentContent } : item));
        } else {
            setContentItems([...contentItems, { ...currentContent, id: Date.now().toString(), updated: new Date().toISOString().split('T')[0], author: 'Admin' }]);
        }
        setEditorVisible(false);
    };

    const handleDeleteContent = (id) => {
        setContentItems(contentItems.filter(item => item.id !== id));
    };

    const filteredContent = contentItems.filter(item => {
        const matchesTab = activeTab === 'All Content' || item.type === activeTab.slice(0, -1) || (activeTab === 'Workout Guides' && item.type === 'Workout Guide');
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterStatus === 'All' || item.status === filterStatus;
        return matchesTab && matchesSearch && matchesFilter;
    });

    return (
        <View style={styles.container}>
            <ScrollView style={styles.mainContent}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.pageTitle}>Content Manager</Text>
                        <Text style={styles.pageSubtitle}>Create, edit, and organize app content.</Text>
                    </View>
                    <TouchableOpacity style={styles.primaryButton} onPress={handleNewContent}>
                        <Ionicons name="add" size={20} color="#FFF" />
                        <Text style={styles.primaryButtonText}>New Content</Text>
                    </TouchableOpacity>
                </View>

                {/* Tabs */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer}>
                    {tabs.map(tab => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tab, activeTab === tab && styles.tabActive]}
                            onPress={() => setActiveTab(tab)}
                        >
                            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Search and Filters */}
                <View style={styles.filtersRow}>
                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={18} color="#718096" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search content…"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                    <View style={styles.filterContainer}>
                        {['All', 'Published', 'Draft', 'Archived'].map(status => (
                            <TouchableOpacity
                                key={status}
                                style={[styles.filterOption, filterStatus === status && styles.filterOptionActive]}
                                onPress={() => setFilterStatus(status)}
                            >
                                <Text style={[styles.filterText, filterStatus === status && styles.filterTextActive]}>{status}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Stats Cards */}
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{contentItems.length}</Text>
                        <Text style={styles.statLabel}>Total Content</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{contentItems.filter(i => i.status === 'Published').length}</Text>
                        <Text style={styles.statLabel}>Published</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{contentItems.filter(i => i.status === 'Draft').length}</Text>
                        <Text style={styles.statLabel}>Drafts</Text>
                    </View>
                </View>

                {/* Content Table */}
                <View style={styles.tableCard}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeaderCell, { flex: 0.5 }]}></Text>
                        <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Title</Text>
                        <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Type</Text>
                        <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Status</Text>
                        <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Updated</Text>
                        <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Actions</Text>
                    </View>
                    {filteredContent.map(item => (
                        <View key={item.id} style={styles.tableRow}>
                            <Text style={[styles.tableCell, { flex: 0.5, fontSize: 24 }]}>{item.thumbnail}</Text>
                            <Text style={[styles.tableCell, { flex: 2, fontWeight: '600' }]}>{item.title}</Text>
                            <Text style={[styles.tableCell, { flex: 1 }]}>{item.type}</Text>
                            <View style={[styles.tableCell, { flex: 1 }]}>
                                <View style={[styles.statusBadge, item.status === 'Published' ? styles.statusPublished : styles.statusDraft]}>
                                    <Text style={[styles.statusText, item.status === 'Published' ? styles.statusTextPublished : styles.statusTextDraft]}>
                                        {item.status}
                                    </Text>
                                </View>
                            </View>
                            <Text style={[styles.tableCell, { flex: 1, color: '#718096' }]}>{item.updated}</Text>
                            <View style={[styles.tableCell, { flex: 1, flexDirection: 'row', gap: 8 }]}>
                                <TouchableOpacity onPress={() => handleEditContent(item)}>
                                    <Ionicons name="create-outline" size={18} color="#3182CE" />
                                </TouchableOpacity>
                                <TouchableOpacity>
                                    <Ionicons name="copy-outline" size={18} color="#718096" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDeleteContent(item.id)}>
                                    <Ionicons name="trash-outline" size={18} color="#E53E3E" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Static Pages */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Static Pages</Text>
                    {['Terms & Conditions', 'Privacy Policy', 'Refund Policy', 'About', 'Contact'].map((page, i) => (
                        <View key={i} style={styles.staticPageRow}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <Ionicons name="document-text-outline" size={20} color="#4A5568" />
                                <Text style={styles.staticPageTitle}>{page}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <TouchableOpacity style={styles.outlineButton}>
                                    <Text style={styles.outlineButtonText}>Edit</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.outlineButton}>
                                    <Text style={styles.outlineButtonText}>Preview</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* Editor Modal */}
            <Modal visible={editorVisible} animationType="slide" onRequestClose={() => setEditorVisible(false)}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{currentContent?.id ? 'Edit Content' : 'New Content'}</Text>
                        <TouchableOpacity onPress={() => setEditorVisible(false)}>
                            <Ionicons name="close" size={28} color="#4A5568" />
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.modalContent}>
                        <Text style={styles.label}>Title</Text>
                        <TextInput
                            style={styles.input}
                            value={currentContent?.title}
                            onChangeText={t => setCurrentContent({ ...currentContent, title: t })}
                        />

                        <Text style={styles.label}>Type</Text>
                        <View style={styles.typeSelector}>
                            {['Page', 'Article', 'Announcement', 'Banner', 'Workout Guide', 'Legal'].map(type => (
                                <TouchableOpacity
                                    key={type}
                                    style={[styles.typeOption, currentContent?.type === type && styles.typeOptionActive]}
                                    onPress={() => setCurrentContent({ ...currentContent, type })}
                                >
                                    <Text style={[styles.typeText, currentContent?.type === type && styles.typeTextActive]}>{type}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.label}>Content</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            multiline
                            numberOfLines={10}
                            value={currentContent?.content}
                            onChangeText={t => setCurrentContent({ ...currentContent, content: t })}
                            placeholder="Write your content here..."
                        />

                        <Text style={styles.label}>SEO Meta Title</Text>
                        <TextInput
                            style={styles.input}
                            value={currentContent?.metaTitle}
                            onChangeText={t => setCurrentContent({ ...currentContent, metaTitle: t })}
                        />

                        <Text style={styles.label}>SEO Meta Description</Text>
                        <TextInput
                            style={styles.input}
                            value={currentContent?.metaDescription}
                            onChangeText={t => setCurrentContent({ ...currentContent, metaDescription: t })}
                        />

                        <View style={styles.statusRow}>
                            <Text style={styles.label}>Published</Text>
                            <Switch
                                value={currentContent?.status === 'Published'}
                                onValueChange={v => setCurrentContent({ ...currentContent, status: v ? 'Published' : 'Draft' })}
                            />
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelButton} onPress={() => setEditorVisible(false)}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveModalButton} onPress={handleSaveContent}>
                                <Text style={styles.saveModalButtonText}>Save Content</Text>
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

    tabsContainer: { marginBottom: 24 },
    tab: { paddingVertical: 10, paddingHorizontal: 20, marginRight: 8, borderRadius: 8, backgroundColor: '#FFF' },
    tabActive: { backgroundColor: '#3182CE' },
    tabText: { fontSize: 15, color: '#4A5568', fontWeight: '500' },
    tabTextActive: { color: '#FFF', fontWeight: '600' },

    filtersRow: { flexDirection: 'row', marginBottom: 24, gap: 16 },
    searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#E2E8F0' },
    searchInput: { flex: 1, padding: 10, fontSize: 15 },
    filterContainer: { flexDirection: 'row', backgroundColor: '#F7FAFC', borderRadius: 8, padding: 4, gap: 4 },
    filterOption: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
    filterOptionActive: { backgroundColor: '#FFF', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    filterText: { fontSize: 13, color: '#718096' },
    filterTextActive: { color: '#2D3748', fontWeight: '600' },

    statsGrid: { flexDirection: 'row', gap: 16, marginBottom: 24 },
    statCard: { flex: 1, backgroundColor: '#FFF', padding: 20, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    statValue: { fontSize: 28, fontWeight: 'bold', color: '#2D3748', marginBottom: 4 },
    statLabel: { fontSize: 14, color: '#718096' },

    tableCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, marginBottom: 24 },
    tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 12, marginBottom: 12 },
    tableHeaderCell: { fontSize: 13, fontWeight: '600', color: '#4A5568', textTransform: 'uppercase' },
    tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F7FAFC' },
    tableCell: { fontSize: 14, color: '#2D3748' },
    statusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, alignSelf: 'flex-start' },
    statusPublished: { backgroundColor: '#F0FFF4' },
    statusDraft: { backgroundColor: '#FEF5E7' },
    statusText: { fontSize: 12, fontWeight: '600' },
    statusTextPublished: { color: '#38A169' },
    statusTextDraft: { color: '#D69E2E' },

    sectionCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, marginBottom: 24 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#2D3748', marginBottom: 16 },
    staticPageRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F7FAFC' },
    staticPageTitle: { fontSize: 15, color: '#2D3748', fontWeight: '500' },
    outlineButton: { borderWidth: 1, borderColor: '#E2E8F0', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
    outlineButtonText: { color: '#4A5568', fontSize: 13, fontWeight: '600' },

    modalContainer: { flex: 1, backgroundColor: '#FFF' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#1A202C' },
    modalContent: { flex: 1, padding: 24 },
    label: { fontSize: 14, fontWeight: '600', color: '#4A5568', marginBottom: 8, marginTop: 16 },
    input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#FFF' },
    textArea: { height: 200, textAlignVertical: 'top' },
    typeSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    typeOption: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFF' },
    typeOptionActive: { backgroundColor: '#EBF8FF', borderColor: '#3182CE' },
    typeText: { fontSize: 14, color: '#4A5568' },
    typeTextActive: { color: '#3182CE', fontWeight: '600' },
    statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 32, marginBottom: 24 },
    cancelButton: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
    cancelButtonText: { color: '#4A5568', fontWeight: '600' },
    saveModalButton: { backgroundColor: '#3182CE', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
    saveModalButtonText: { color: '#FFF', fontWeight: 'bold' },
});

export default AdminContentManagerScreen;
