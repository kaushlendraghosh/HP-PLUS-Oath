import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View, Pressable } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { supabase } from './src/lib/supabase';
import { isAllowedEmail, saveUserProfile, signInWithGoogle } from './src/lib/auth';
import GoogleButton from './src/components/GoogleButton';
import Notice from './src/components/Notice';

export default function App() {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('error');

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data, error }) => {
      if (!active) return;
      if (error) setMessage(error.message);
      const current = data?.session;
      if (current?.user && !isAllowedEmail(current.user.email)) {
        await supabase.auth.signOut();
        setSession(null);
        setMessage('Access restricted. Please login using your official @hbplus.fit email.');
      } else {
        setSession(current || null);
      }
      setChecking(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!active) return;
      if (nextSession?.user && !isAllowedEmail(nextSession.user.email)) {
        setSession(null);
        setMessage('Access restricted. Please login using your official @hbplus.fit email.');
        setMessageType('error');
        // Defer Supabase calls so the auth event callback does not deadlock.
        setTimeout(() => supabase.auth.signOut(), 0);
      } else {
        setSession(nextSession || null);
        if (nextSession?.user) {
          // Run follow-up Supabase requests outside the auth callback to avoid lock/deadlock issues.
          setTimeout(async () => {
            try { await saveUserProfile(nextSession.user); }
            catch (e) { setMessage(e.message || 'Could not save your profile.'); setMessageType('error'); }
          }, 0);
        }
      }
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  async function handleLogin() {
    setLoading(true); setMessage('');
    try {
      const result = await signInWithGoogle();
      if (result?.cancelled) setMessage('Sign-in was cancelled.');
    } catch (e) {
      setMessage(e.message || 'Unable to sign in. Please try again.');
      setMessageType('error');
    } finally { setLoading(false); }
  }

  async function handleLogout() {
    setLoading(true); setMessage('');
    const { error } = await supabase.auth.signOut();
    setLoading(false);
    if (error) { setMessage(error.message); setMessageType('error'); }
    else { setSession(null); setMessage('You have been logged out.'); setMessageType('success'); }
  }

  const user = session?.user;
  const name = user?.user_metadata?.full_name || user?.user_metadata?.name || 'Team member';
  const avatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  if (checking) return <SafeAreaView style={styles.loadingScreen}><ExpoStatusBar style="dark"/><ActivityIndicator size="large" color="#4f46e5"/><Text style={styles.loadingText}>Checking your session…</Text></SafeAreaView>;

  return (
    <SafeAreaView style={styles.safe}>
      <ExpoStatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <View style={styles.topLine}><View style={styles.brandMark}><Text style={styles.brandMarkText}>H</Text></View><Text style={styles.brand}>hbplus.fit <Text style={styles.brandLight}>/ Workspace</Text></Text><View style={styles.securePill}><View style={styles.greenDot}/><Text style={styles.secureText}>SECURE ACCESS</Text></View></View>

        {!user ? (
          <View style={styles.loginLayout}>
            <View style={styles.hero}>
              <View style={styles.eyebrow}><View style={styles.eyebrowDot}/><Text style={styles.eyebrowText}>OFFICIAL TEAM PORTAL</Text></View>
              <Text style={styles.headline}>Your work.{ '\n' }One secure{ '\n' }workspace.</Text>
              <Text style={styles.subheadline}>Sign in with your official account to access your team dashboard and workspace resources.</Text>
              <View style={styles.featureList}>
                <Feature title="Verified access" detail="Only @hbplus.fit accounts" />
                <Feature title="Protected workspace" detail="Private, authenticated sessions" />
                <Feature title="One account, anywhere" detail="Works on web and mobile" />
              </View>
            </View>
            <View style={styles.authCard}>
              <Text style={styles.cardKicker}>WELCOME BACK</Text>
              <Text style={styles.cardTitle}>Sign in to continue</Text>
              <Text style={styles.cardDescription}>Use your official Google Workspace account.</Text>
              <GoogleButton onPress={handleLogin} loading={loading} disabled={loading}/>
              <Notice type={messageType}>{message}</Notice>
              <View style={styles.dividerRow}><View style={styles.divider}/><Text style={styles.dividerLabel}>ACCESS POLICY</Text><View style={styles.divider}/></View>
              <Text style={styles.policyText}>Access is limited to email addresses ending in <Text style={styles.domain}>@hbplus.fit</Text>. Personal Gmail accounts are not permitted.</Text>
              <View style={styles.lockRow}><Text style={styles.lockIcon}>✓</Text><Text style={styles.lockText}>Secure sign-in powered by Google OAuth</Text></View>
            </View>
          </View>
        ) : (
          <View style={styles.dashboardWrap}>
            <View style={styles.welcomeBlock}><Text style={styles.eyebrowText}>HBPLUS WORKSPACE</Text><Text style={styles.dashboardTitle}>Welcome back, {name.split(' ')[0]}.</Text><Text style={styles.subheadline}>You are signed in with an approved account.</Text></View>
            <View style={styles.profileCard}>
              <View style={styles.profileTop}>
                {avatar ? <Image source={{ uri: avatar }} style={styles.avatar}/> : <View style={styles.avatarFallback}><Text style={styles.avatarFallbackText}>{name.charAt(0).toUpperCase()}</Text></View>}
                <View style={styles.profileInfo}><Text style={styles.profileName}>{name}</Text><Text style={styles.profileEmail}>{user.email}</Text><View style={styles.allowedBadge}><View style={styles.greenDot}/><Text style={styles.allowedText}>Verified account</Text></View></View>
              </View>
              <View style={styles.profileDivider}/>
              <InfoRow label="Account provider" value="Google OAuth"/>
              <InfoRow label="Email domain" value="hbplus.fit"/>
              <InfoRow label="Access status" value="Authorized"/>
              <Pressable onPress={handleLogout} disabled={loading} style={({ pressed }) => [styles.logoutButton, pressed && { opacity: 0.8 }]}><Text style={styles.logoutText}>{loading ? 'Signing out…' : 'Sign out'}</Text></Pressable>
              <Notice type={messageType}>{message}</Notice>
            </View>
            <Text style={styles.dashboardFootnote}>Your session is protected. Sign out when using a shared device.</Text>
          </View>
        )}
        <View style={styles.footer}><Text style={styles.footerText}>© {new Date().getFullYear()} HBPlus Fit</Text><Text style={styles.footerText}>Secure access portal</Text></View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Feature({ title, detail }) { return <View style={styles.featureRow}><View style={styles.featureCheck}><Text style={styles.featureCheckText}>✓</Text></View><View style={{ flex: 1 }}><Text style={styles.featureTitle}>{title}</Text><Text style={styles.featureDetail}>{detail}</Text></View></View>; }
function InfoRow({ label, value }) { return <View style={styles.infoRow}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>; }

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f7f8fc' }, page: { flexGrow: 1, paddingHorizontal: 30, paddingTop: 20, paddingBottom: 18, maxWidth: 1240, width: '100%', alignSelf: 'center' },
  loadingScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f7f8fc', gap: 14 }, loadingText: { color: '#64708a', fontSize: 14 },
  topLine: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 44 }, brandMark: { width: 36, height: 36, borderRadius: 11, backgroundColor: '#4f46e5', alignItems: 'center', justifyContent: 'center' }, brandMarkText: { color: '#fff', fontSize: 20, fontWeight: '900' }, brand: { color: '#17233b', fontSize: 17, fontWeight: '800' }, brandLight: { color: '#7a8498', fontWeight: '500' }, securePill: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#edf9f1', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 11 }, greenDot: { width: 7, height: 7, borderRadius: 5, backgroundColor: '#16a05d' }, secureText: { fontSize: 9, letterSpacing: 1, color: '#197647', fontWeight: '800' },
  loginLayout: { flex: 1, flexDirection: Platform.OS === 'web' ? 'row' : 'column', alignItems: 'center', justifyContent: 'space-between', gap: 42, paddingVertical: 8 }, hero: { flex: 1, width: '100%', maxWidth: 570, paddingVertical: 18 }, eyebrow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 22 }, eyebrowDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4f46e5' }, eyebrowText: { color: '#4f46e5', fontSize: 11, fontWeight: '800', letterSpacing: 1.6 }, headline: { color: '#17233b', fontSize: Platform.OS === 'web' ? 54 : 43, lineHeight: Platform.OS === 'web' ? 62 : 50, fontWeight: '800', letterSpacing: -1.8 }, subheadline: { color: '#69758c', fontSize: 15, lineHeight: 25, marginTop: 18, maxWidth: 460 }, featureList: { gap: 20, marginTop: 36 }, featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 }, featureCheck: { width: 25, height: 25, borderRadius: 9, backgroundColor: '#e9e8ff', alignItems: 'center', justifyContent: 'center' }, featureCheckText: { color: '#4f46e5', fontSize: 14, fontWeight: '900' }, featureTitle: { color: '#27344c', fontSize: 14, fontWeight: '700' }, featureDetail: { color: '#8992a5', fontSize: 12, marginTop: 4 },
  authCard: { width: '100%', maxWidth: 430, padding: 30, borderRadius: 22, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e9ecf4', ...(Platform.OS === 'web' ? { boxShadow: '0px 18px 50px rgba(28, 39, 74, 0.07)' } : { elevation: 3 }) }, cardKicker: { fontSize: 10, letterSpacing: 1.8, color: '#4f46e5', fontWeight: '800' }, cardTitle: { color: '#17233b', fontSize: 25, fontWeight: '800', marginTop: 10 }, cardDescription: { color: '#7d879a', fontSize: 13, lineHeight: 20, marginTop: 8, marginBottom: 26 }, dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 25, marginBottom: 16 }, divider: { flex: 1, height: 1, backgroundColor: '#edf0f5' }, dividerLabel: { color: '#a0a8b8', fontSize: 9, letterSpacing: 1.2, fontWeight: '800' }, policyText: { color: '#7c879b', fontSize: 12, lineHeight: 20 }, domain: { color: '#303d59', fontWeight: '800' }, lockRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 22 }, lockIcon: { color: '#15945a', fontWeight: '900', fontSize: 13 }, lockText: { color: '#79849a', fontSize: 11 },
  dashboardWrap: { flex: 1, width: '100%', maxWidth: 760, alignSelf: 'center', paddingVertical: 24 }, welcomeBlock: { marginBottom: 28 }, dashboardTitle: { color: '#17233b', fontSize: 34, fontWeight: '800', marginTop: 10, letterSpacing: -0.8 }, profileCard: { backgroundColor: '#fff', borderRadius: 20, padding: 26, borderColor: '#e8ebf3', borderWidth: 1, ...(Platform.OS === 'web' ? { boxShadow: '0px 18px 50px rgba(28, 39, 74, 0.06)' } : { elevation: 2 }) }, profileTop: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 }, avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#eef0f8' }, avatarFallback: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#e9e8ff', alignItems: 'center', justifyContent: 'center' }, avatarFallbackText: { color: '#4f46e5', fontSize: 27, fontWeight: '800' }, profileInfo: { flex: 1 }, profileName: { color: '#202c44', fontSize: 18, fontWeight: '800' }, profileEmail: { color: '#7e899c', fontSize: 13, marginTop: 4 }, allowedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: '#effaf3', borderRadius: 15, paddingVertical: 5, paddingHorizontal: 9, marginTop: 9 }, allowedText: { color: '#197647', fontSize: 10, fontWeight: '700' }, profileDivider: { height: 1, backgroundColor: '#edf0f5', marginBottom: 8 }, infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f2f7' }, infoLabel: { color: '#8993a5', fontSize: 13 }, infoValue: { color: '#293650', fontSize: 13, fontWeight: '700' }, logoutButton: { marginTop: 24, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: '#17233b' }, logoutText: { color: '#fff', fontWeight: '700', fontSize: 14 }, dashboardFootnote: { textAlign: 'center', color: '#9aa3b3', fontSize: 12, marginTop: 18 },
  footer: { marginTop: 42, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#e8ebf3', flexDirection: 'row', justifyContent: 'space-between', gap: 10 }, footerText: { color: '#9aa3b3', fontSize: 11 }
});
