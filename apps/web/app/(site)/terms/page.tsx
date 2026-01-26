export const metadata = {
    title: "Terms of Service",
    description: "Terms of Service for GoalGazer - Data-driven football tactical analysis platform.",
};

export default function TermsPage() {
    return (
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <h1>Terms of Service</h1>
            <p style={{ color: "var(--color-text-muted)", fontSize: "1.125rem", marginBottom: "2rem" }}>
                Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>

            <section style={{ marginBottom: "3rem" }}>
                <h2>1. Acceptance of Terms</h2>
                <p>
                    By accessing and using GoalGazer ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Service, please do not use the Service.
                </p>
            </section>

            <section style={{ marginBottom: "3rem" }}>
                <h2>2. Use License</h2>
                <p>
                    Permission is granted to temporarily access the materials (information or software) on GoalGazer for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
                </p>
                <ul>
                    <li>Modify or copy the materials</li>
                    <li>Use the materials for any commercial purpose or for any public display</li>
                    <li>Attempt to reverse engineer any software contained on GoalGazer</li>
                    <li>Remove any copyright or other proprietary notations from the materials</li>
                    <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
                </ul>
            </section>

            <section style={{ marginBottom: "3rem" }}>
                <h2>3. Content Ownership</h2>
                <p>
                    All content published on GoalGazer, including but not limited to text, graphics, logos, images, and software, is the property of GoalGazer or its content suppliers and is protected by international copyright laws.
                </p>
                <p>
                    Match data and statistics are sourced from licensed third-party providers. All visualizations and tactical analysis are original content created by GoalGazer.
                </p>
            </section>

            <section style={{ marginBottom: "3rem" }}>
                <h2>4. Disclaimer</h2>
                <p>
                    The materials on GoalGazer are provided on an 'as is' basis. GoalGazer makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
                </p>
                <p>
                    GoalGazer does not warrant or make any representations concerning the accuracy, likely results, or reliability of the use of the materials on its website or otherwise relating to such materials or on any sites linked to this site.
                </p>
            </section>

            <section style={{ marginBottom: "3rem" }}>
                <h2>5. Limitations</h2>
                <p>
                    In no event shall GoalGazer or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on GoalGazer, even if GoalGazer or a GoalGazer authorized representative has been notified orally or in writing of the possibility of such damage.
                </p>
            </section>

            <section style={{ marginBottom: "3rem" }}>
                <h2>6. Accuracy of Materials</h2>
                <p>
                    The materials appearing on GoalGazer could include technical, typographical, or photographic errors. GoalGazer does not warrant that any of the materials on its website are accurate, complete, or current. GoalGazer may make changes to the materials contained on its website at any time without notice.
                </p>
            </section>

            <section style={{ marginBottom: "3rem" }}>
                <h2>7. Links</h2>
                <p>
                    GoalGazer has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by GoalGazer of the site. Use of any such linked website is at the user's own risk.
                </p>
            </section>

            <section style={{ marginBottom: "3rem" }}>
                <h2>8. Modifications</h2>
                <p>
                    GoalGazer may revise these Terms of Service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these Terms of Service.
                </p>
            </section>

            <section style={{ marginBottom: "3rem" }}>
                <h2>9. Governing Law</h2>
                <p>
                    These terms and conditions are governed by and construed in accordance with the laws and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
                </p>
            </section>

            <section style={{ marginBottom: "3rem" }}>
                <h2>10. Contact Information</h2>
                <p>
                    If you have any questions about these Terms of Service, please contact us at:
                </p>
                <p style={{ marginTop: "1rem" }}>
                    <strong>Email:</strong> <a href="mailto:contact@goalgazer.example">contact@goalgazer.example</a>
                </p>
            </section>

            <div style={{
                marginTop: "4rem",
                padding: "2rem",
                background: "var(--color-bg-alt)",
                borderRadius: "var(--radius-lg)",
                borderLeft: "4px solid var(--color-primary)"
            }}>
                <h3 style={{ marginTop: 0 }}>Questions?</h3>
                <p style={{ marginBottom: 0 }}>
                    If you have any questions about our Terms of Service, please don't hesitate to{" "}
                    <a href="/contact">contact us</a>.
                </p>
            </div>
        </div>
    );
}
