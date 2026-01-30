import { useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Zap, Users, Building2, ArrowRight } from "lucide-react";

const plans = [
  {
    id: "free",
    name: "Free",
    price: 0,
    period: "forever",
    description: "Perfect for trying out AI visibility tracking",
    scans: "1/day",
    prompts: 5,
    features: [
      "1 scan per day",
      "5 prompts per scan",
      "Basic AI visibility score",
      "1 prompt result visible",
      "Email-gated full results",
    ],
    cta: "Get Started Free",
    popular: false,
    icon: Zap,
  },
  {
    id: "pro",
    name: "Pro",
    price: 19,
    period: "/month",
    description: "For marketers who need regular AI visibility insights",
    scans: "10/month",
    prompts: 50,
    features: [
      "10 scans per month",
      "50 prompts per month",
      "Full AI visibility results",
      "CSV export",
      "Slack alerts",
      "API access",
      "Priority email support",
    ],
    cta: "Upgrade to Pro",
    popular: true,
    icon: Zap,
  },
  {
    id: "team",
    name: "Team",
    price: 49,
    period: "/month",
    description: "For teams tracking multiple brands",
    scans: "30/month",
    prompts: 150,
    features: [
      "30 scans per month",
      "150 prompts per month",
      "Everything in Pro",
      "White-label PDF reports",
      "Team collaboration",
      "Priority support",
    ],
    cta: "Start Team Plan",
    popular: false,
    icon: Users,
  },
  {
    id: "agency",
    name: "Agency",
    price: 149,
    period: "/month",
    description: "For agencies managing client AI visibility",
    scans: "Unlimited",
    prompts: 500,
    features: [
      "Unlimited scans",
      "500 prompts per month",
      "Everything in Team",
      "Multi-domain dashboard",
      "Custom branding",
      "Dedicated account manager",
      "API priority access",
    ],
    cta: "Contact Sales",
    popular: false,
    icon: Building2,
  },
];

const comparisonData = [
  { feature: "Starting Price", us: "$19/mo", otterly: "$49/mo", profound: "$99/mo" },
  { feature: "Prompts at Entry Tier", us: "50", otterly: "30", profound: "100" },
  { feature: "AI Platforms Tracked", us: "3", otterly: "4", profound: "3" },
  { feature: "Free Tier", us: "✓", otterly: "✗", profound: "✗" },
  { feature: "Slack Alerts", us: "Pro+", otterly: "Business", profound: "Enterprise" },
  { feature: "API Access", us: "Pro+", otterly: "Enterprise", profound: "Enterprise" },
  { feature: "White-label Reports", us: "Team+", otterly: "Enterprise", profound: "✗" },
];

export default function Pricing() {
  const [billingPeriod] = useState<"monthly" | "yearly">("monthly");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 pt-20">
        {/* Hero Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto text-center max-w-4xl">
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
              10x Cheaper Than Competitors
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Choose Your AI Visibility Plan
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Track how AI assistants mention your brand. Simple pricing, powerful insights.
            </p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-8 px-4">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {plans.map((plan) => (
                <Card 
                  key={plan.id}
                  className={`relative bg-card border-border hover:border-primary/50 transition-all duration-300 ${
                    plan.popular ? "ring-2 ring-primary shadow-lg shadow-primary/20" : ""
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-3">
                      <plan.icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl text-foreground">{plan.name}</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="text-center">
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-foreground">
                        ${plan.price}
                      </span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                    
                    <div className="space-y-3 text-left">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  
                  <CardFooter>
                    <Button 
                      className={`w-full ${
                        plan.popular 
                          ? "bg-primary hover:bg-primary/90 text-primary-foreground" 
                          : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                      }`}
                      asChild
                    >
                      <Link to={plan.id === "agency" ? "/contact" : "/#scan"}>
                        {plan.cta}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 text-foreground">
                Why We're 10x Cheaper
              </h2>
              <p className="text-muted-foreground">
                Compare our pricing with enterprise tools like Otterly.ai and Profound
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-4 px-4 font-semibold text-foreground">Feature</th>
                    <th className="text-center py-4 px-4 font-semibold text-primary">
                      <div className="flex flex-col items-center">
                        <span className="text-lg">AImentionyou</span>
                        <Badge variant="secondary" className="mt-1">You're here</Badge>
                      </div>
                    </th>
                    <th className="text-center py-4 px-4 font-semibold text-muted-foreground">Otterly.ai</th>
                    <th className="text-center py-4 px-4 font-semibold text-muted-foreground">Profound</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((row, index) => (
                    <tr key={index} className="border-b border-border/50">
                      <td className="py-4 px-4 text-muted-foreground">{row.feature}</td>
                      <td className="py-4 px-4 text-center">
                        <span className={`font-semibold ${
                          row.us.includes("$") ? "text-primary text-lg" : "text-foreground"
                        }`}>
                          {row.us}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center text-muted-foreground">{row.otterly}</td>
                      <td className="py-4 px-4 text-center text-muted-foreground">{row.profound}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
              Frequently Asked Questions
            </h2>
            
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="font-semibold text-foreground mb-2">What counts as a "scan"?</h3>
                <p className="text-muted-foreground">
                  A scan is when you analyze a domain across AI platforms (ChatGPT, Gemini, Perplexity). 
                  Each scan can include up to your plan's prompt limit.
                </p>
              </div>
              
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="font-semibold text-foreground mb-2">Can I upgrade or downgrade anytime?</h3>
                <p className="text-muted-foreground">
                  Yes! You can change your plan at any time. Upgrades take effect immediately, 
                  and downgrades apply at the end of your billing period.
                </p>
              </div>
              
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="font-semibold text-foreground mb-2">What happens if I exceed my prompt limit?</h3>
                <p className="text-muted-foreground">
                  You can purchase additional prompts at $0.15 each, or upgrade to a higher plan 
                  for more monthly prompts.
                </p>
              </div>
              
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="font-semibold text-foreground mb-2">Do you offer refunds?</h3>
                <p className="text-muted-foreground">
                  Yes, we offer a 14-day money-back guarantee on all paid plans. 
                  If you're not satisfied, contact us for a full refund.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 bg-primary/10">
          <div className="container mx-auto text-center max-w-2xl">
            <h2 className="text-3xl font-bold mb-4 text-foreground">
              Ready to Track Your AI Visibility?
            </h2>
            <p className="text-muted-foreground mb-8">
              Start with a free scan and see how AI assistants perceive your brand.
            </p>
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground" asChild>
              <Link to="/#scan">
                Run Free Scan Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
