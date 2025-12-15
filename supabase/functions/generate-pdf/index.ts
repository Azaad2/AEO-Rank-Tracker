import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GeneratePDFRequest {
  scanId: string;
  email: string;
  sendEmail?: boolean;
}

interface ScanResult {
  prompt: string;
  mentioned: boolean;
  cited: boolean;
  citation_rank: number | null;
  top_cited_domains: string[];
}

// Generate HTML content for PDF
function generatePDFHTML(
  domain: string,
  score: number,
  results: ScanResult[],
  email: string
): string {
  const scoreColor = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444';
  
  const resultsHTML = results.map((result, idx) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${idx + 1}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${result.prompt}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${result.mentioned ? '✓' : '—'}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${result.cited ? '✓' : '—'}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${result.citation_rank || '—'}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 12px;">${result.top_cited_domains?.slice(0, 3).join(', ') || '—'}</td>
    </tr>
  `).join('');

  // Analysis summary
  const mentionedCount = results.filter(r => r.mentioned).length;
  const citedCount = results.filter(r => r.cited).length;
  const top3Count = results.filter(r => r.citation_rank && r.citation_rank <= 3).length;

  // Find top competitors
  const competitorCounts: Record<string, number> = {};
  results.forEach(r => {
    r.top_cited_domains?.forEach(d => {
      if (d && d !== domain) {
        competitorCounts[d] = (competitorCounts[d] || 0) + 1;
      }
    });
  });
  const topCompetitors = Object.entries(competitorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const recommendationsHTML = generateRecommendations(results, domain, score);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>AI Visibility Report - ${domain}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px; color: #111827; line-height: 1.5; }
    .header { text-align: center; margin-bottom: 40px; }
    .logo { font-size: 24px; font-weight: bold; color: #6366f1; }
    .domain { font-size: 32px; font-weight: bold; margin: 20px 0; }
    .score-section { display: flex; justify-content: center; gap: 60px; margin: 40px 0; }
    .score-box { text-align: center; }
    .score-value { font-size: 64px; font-weight: bold; }
    .score-label { font-size: 14px; color: #6b7280; margin-top: 8px; }
    .section { margin: 40px 0; page-break-inside: avoid; }
    .section-title { font-size: 20px; font-weight: bold; margin-bottom: 16px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th { text-align: left; padding: 12px; background: #f3f4f6; font-weight: 600; }
    .summary-grid { display: flex; gap: 16px; flex-wrap: wrap; }
    .summary-card { background: #f9fafb; padding: 20px; border-radius: 8px; text-align: center; flex: 1; min-width: 120px; }
    .summary-value { font-size: 28px; font-weight: bold; color: #111827; }
    .summary-label { font-size: 12px; color: #6b7280; margin-top: 4px; }
    .competitor-list { list-style: none; padding: 0; }
    .competitor-list li { padding: 8px 0; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; }
    .recommendation { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 12px 0; border-radius: 4px; }
    .recommendation.critical { background: #fee2e2; border-left-color: #ef4444; }
    .recommendation.success { background: #dcfce7; border-left-color: #22c55e; }
    .footer { margin-top: 60px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
    @media print {
      body { padding: 20px; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">AI Visibility Checker</div>
    <div class="domain">${domain}</div>
    <p style="color: #6b7280;">Generated for ${email} on ${new Date().toLocaleDateString()}</p>
  </div>

  <div class="score-section">
    <div class="score-box">
      <div class="score-value" style="color: ${scoreColor};">${score}</div>
      <div class="score-label">AI VISIBILITY SCORE</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Summary</div>
    <div class="summary-grid">
      <div class="summary-card">
        <div class="summary-value">${results.length}</div>
        <div class="summary-label">PROMPTS ANALYZED</div>
      </div>
      <div class="summary-card">
        <div class="summary-value">${mentionedCount}</div>
        <div class="summary-label">MENTIONS</div>
      </div>
      <div class="summary-card">
        <div class="summary-value">${citedCount}</div>
        <div class="summary-label">CITATIONS</div>
      </div>
      <div class="summary-card">
        <div class="summary-value">${top3Count}</div>
        <div class="summary-label">TOP 3 RANKINGS</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Detailed Results</div>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Prompt</th>
          <th style="text-align: center;">Mentioned</th>
          <th style="text-align: center;">Cited</th>
          <th style="text-align: center;">Rank</th>
          <th>Top Competitors</th>
        </tr>
      </thead>
      <tbody>
        ${resultsHTML}
      </tbody>
    </table>
  </div>

  ${topCompetitors.length > 0 ? `
  <div class="section">
    <div class="section-title">Top Competitors</div>
    <ul class="competitor-list">
      ${topCompetitors.map(([comp, count]) => `
        <li>
          <span>${comp}</span>
          <span style="color: #6b7280;">${count} appearance${count > 1 ? 's' : ''}</span>
        </li>
      `).join('')}
    </ul>
  </div>
  ` : ''}

  <div class="section">
    <div class="section-title">Recommendations</div>
    ${recommendationsHTML}
  </div>

  <div class="section">
    <div class="section-title">Next Steps</div>
    <ol style="line-height: 2;">
      <li>Focus on creating content that directly answers the prompts where you're not mentioned</li>
      <li>Build authority through quality backlinks and citations from trusted sources</li>
      <li>Analyze competitor content to understand why they're being cited over you</li>
      <li>Optimize existing content with structured data and clear answers</li>
      <li>Re-run this scan monthly to track your improvement</li>
    </ol>
  </div>

  <div class="footer">
    <p>This report was generated by AI Visibility Checker</p>
    <p>Results are based on simulated AI answer generation using real search data.</p>
  </div>
</body>
</html>
  `;
}

function generateRecommendations(results: ScanResult[], domain: string, score: number): string {
  const recommendations: { type: 'critical' | 'warning' | 'success', text: string }[] = [];

  const notMentioned = results.filter(r => !r.mentioned);
  const mentionedNotCited = results.filter(r => r.mentioned && !r.cited);
  const citedLowRank = results.filter(r => r.cited && r.citation_rank && r.citation_rank > 3);

  if (notMentioned.length > 0) {
    recommendations.push({
      type: 'critical',
      text: `<strong>Content Gap:</strong> You're not mentioned in ${notMentioned.length} prompt(s). Create targeted content for: "${notMentioned[0].prompt}"${notMentioned.length > 1 ? ` and ${notMentioned.length - 1} more` : ''}.`
    });
  }

  if (mentionedNotCited.length > 0) {
    recommendations.push({
      type: 'warning',
      text: `<strong>Authority Building:</strong> You're mentioned but not cited in ${mentionedNotCited.length} prompt(s). Focus on earning backlinks and improving E-E-A-T signals.`
    });
  }

  if (citedLowRank.length > 0) {
    recommendations.push({
      type: 'warning',
      text: `<strong>Ranking Improvement:</strong> You're cited but ranked #4+ in ${citedLowRank.length} prompt(s). Improve content depth and relevance to move into top 3.`
    });
  }

  if (score >= 70) {
    recommendations.push({
      type: 'success',
      text: `<strong>Great Performance:</strong> Your AI visibility score of ${score} indicates strong presence. Focus on maintaining your position and expanding to new keywords.`
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      type: 'success',
      text: 'Your scan results look good! Continue monitoring your AI visibility regularly.'
    });
  }

  return recommendations.map(r => `
    <div class="recommendation ${r.type}">
      ${r.text}
    </div>
  `).join('');
}

function generateEmailHTML(domain: string, score: number, downloadUrl: string): string {
  const scoreColor = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
    .logo { font-size: 20px; font-weight: bold; color: #6366f1; text-align: center; margin-bottom: 30px; }
    .title { font-size: 24px; font-weight: bold; text-align: center; margin-bottom: 10px; color: #111827; }
    .subtitle { font-size: 16px; color: #6b7280; text-align: center; margin-bottom: 30px; }
    .score-section { text-align: center; background: #f9fafb; border-radius: 8px; padding: 30px; margin-bottom: 30px; }
    .score-value { font-size: 48px; font-weight: bold; color: ${scoreColor}; }
    .score-label { font-size: 12px; color: #6b7280; margin-top: 8px; text-transform: uppercase; }
    .cta-button { display: block; background: #6366f1; color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; text-align: center; margin: 30px 0; }
    .cta-button:hover { background: #5558e8; }
    .features { margin: 30px 0; }
    .feature { display: flex; align-items: flex-start; margin-bottom: 16px; }
    .feature-icon { color: #22c55e; margin-right: 12px; font-size: 18px; }
    .feature-text { color: #374151; font-size: 14px; }
    .footer { text-align: center; color: #9ca3af; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">AI Visibility Checker</div>
      <div class="title">Your AI Visibility Report is Ready!</div>
      <div class="subtitle">Full report for <strong>${domain}</strong></div>
      
      <div class="score-section">
        <div class="score-value">${score}</div>
        <div class="score-label">AI Visibility Score</div>
      </div>
      
      <div class="features">
        <div class="feature">
          <span class="feature-icon">✓</span>
          <span class="feature-text">Complete analysis of all your prompts</span>
        </div>
        <div class="feature">
          <span class="feature-icon">✓</span>
          <span class="feature-text">Competitor breakdown and insights</span>
        </div>
        <div class="feature">
          <span class="feature-icon">✓</span>
          <span class="feature-text">Personalized recommendations for improvement</span>
        </div>
        <div class="feature">
          <span class="feature-icon">✓</span>
          <span class="feature-text">Action checklist for better AI visibility</span>
        </div>
      </div>
      
      <a href="${downloadUrl}" class="cta-button">Download Your Full Report</a>
      
      <div class="footer">
        <p>This report was generated by AI Visibility Checker</p>
        <p>Questions? Reply to this email and we'll help you out.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { scanId, email, sendEmail = false }: GeneratePDFRequest = await req.json();

    if (!scanId || !email) {
      return new Response(
        JSON.stringify({ error: 'Missing scanId or email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📄 Generating PDF for scan ${scanId}, email: ${email}, sendEmail: ${sendEmail}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch scan data
    const { data: scan, error: scanError } = await supabase
      .from('scans')
      .select('*')
      .eq('id', scanId)
      .single();

    if (scanError || !scan) {
      console.error('Scan fetch error:', scanError);
      return new Response(
        JSON.stringify({ error: 'Scan not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch scan results
    const { data: results, error: resultsError } = await supabase
      .from('scan_results')
      .select('*')
      .eq('scan_id', scanId)
      .order('id', { ascending: true });

    if (resultsError) {
      console.error('Results fetch error:', resultsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch results' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate HTML for PDF
    const html = generatePDFHTML(scan.project_domain, scan.score, results || [], email);
    
    // Convert HTML to base64 for download
    const htmlBase64 = btoa(unescape(encodeURIComponent(html)));

    console.log(`✅ PDF HTML generated for ${scan.project_domain}`);

    // Send email if requested
    if (sendEmail) {
      const resendApiKey = Deno.env.get('RESEND_API_KEY');
      if (!resendApiKey) {
        console.error('RESEND_API_KEY not configured');
        return new Response(
          JSON.stringify({ 
            success: true,
            html: html,
            htmlBase64: htmlBase64,
            emailSent: false,
            emailError: 'Email service not configured'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      try {
        const resend = new Resend(resendApiKey);
        
        // Create a data URI for the HTML file attachment
        const emailHtml = generateEmailHTML(
          scan.project_domain, 
          scan.score,
          `data:text/html;base64,${htmlBase64}`
        );

        const emailResponse = await resend.emails.send({
          from: 'AI Visibility Checker <onboarding@resend.dev>',
          to: [email],
          subject: `Your AI Visibility Report for ${scan.project_domain} (Score: ${scan.score})`,
          html: emailHtml,
          attachments: [
            {
              filename: `ai-visibility-report-${scan.project_domain}.html`,
              content: htmlBase64,
            }
          ]
        });

        console.log('📧 Email sent successfully:', emailResponse);

        // Update customer record with pdf_sent_at
        const { error: updateError } = await supabase
          .from('customers')
          .update({ pdf_sent_at: new Date().toISOString() })
          .eq('email', email)
          .eq('scan_id', scanId);

        if (updateError) {
          console.warn('Failed to update pdf_sent_at:', updateError);
        }

        return new Response(
          JSON.stringify({
            success: true,
            domain: scan.project_domain,
            score: scan.score,
            promptsCount: results?.length || 0,
            html: html,
            htmlBase64: htmlBase64,
            emailSent: true,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        return new Response(
          JSON.stringify({
            success: true,
            html: html,
            htmlBase64: htmlBase64,
            emailSent: false,
            emailError: emailError instanceof Error ? emailError.message : 'Failed to send email'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Return HTML content for download
    return new Response(
      JSON.stringify({
        success: true,
        domain: scan.project_domain,
        score: scan.score,
        promptsCount: results?.length || 0,
        html: html,
        htmlBase64: htmlBase64,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('PDF generation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
