import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Brain, 
  Users, 
  TrendingUp, 
  Globe, 
  Star,
  Play,
  ExternalLink,
  Github,
  Mail,
  Heart
} from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";
import teamLucas from "@/assets/team-lucas.jpg";
import teamPaulo from "@/assets/team-paulo.jpg";
import teamVinicius from "@/assets/team-vinicius.jpg";

const Index = () => {
  const scrollToDemo = () => {
    document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-hero overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        
        <div className="relative z-10 container mx-auto px-4 text-center text-white">
          <div className="animate-fade-in">
            <Badge className="mb-6 bg-white/20 text-white border-white/30 backdrop-blur-sm">
              🚀 Intelligent Parental Control
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Wi-Fi Kids
            </h1>
            <p className="text-xl md:text-2xl mb-4 opacity-90">
              Intelligent Parental Control
            </p>
            <p className="text-lg md:text-xl mb-12 opacity-80 max-w-2xl mx-auto">
              Transforming screen time into learning time.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                variant="demo" 
                size="lg" 
                onClick={scrollToDemo}
                className="text-lg px-8 py-4"
              >
                <Play className="w-5 h-5 mr-2" />
                Watch Demo
              </Button>
              <Button 
                variant="hero" 
                size="lg" 
                asChild
                className="text-lg px-8 py-4"
              >
                <a href="http://app.wifikids.fun" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-5 h-5 mr-2" />
                  Try the Prototype
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Problem & Solution */}
      <section className="py-20 bg-gradient-section">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-slide-in">
              <div>
                <Badge className="mb-4 bg-destructive/10 text-destructive border-destructive/20">
                  ⚠️ The Problem
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                  Children at Risk Online
                </h2>
                <div className="space-y-4 text-lg text-muted-foreground">
                  <p>• Children spend 6+ hours daily online</p>
                  <p>• Rising risks of addiction and unsafe content</p>
                  <p>• Poor academic performance correlation</p>
                  <p>• Parents and schools lack effective tools</p>
                </div>
              </div>
            </div>

            <div className="space-y-8 animate-fade-in">
              <div>
                <Badge className="mb-4 bg-secondary/10 text-secondary border-secondary/20">
                  ✅ Our Solution
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                  AI-Powered Learning Gateway
                </h2>
                <div className="space-y-4 text-lg text-muted-foreground mb-6">
                  <p>Wi-Fi Kids combines parental control with an AI tutor.</p>
                  <p>Internet access is unlocked through educational challenges.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">OpenWRT</Badge>
                  <Badge variant="outline">LangChain</Badge>
                  <Badge variant="outline">Python</Badge>
                  <Badge variant="outline">ChatGPT-5</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Video Section */}
      <section id="demo" className="py-20 bg-background">
        <div className="container mx-auto px-4 text-center">
          <div className="animate-fade-in">
            <Badge className="mb-6 bg-accent/10 text-accent border-accent/20">
              🎬 Live Demo
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              See Wi-Fi Kids in Action
            </h2>
            <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
              Watch a child answer a question from the AI tutor to unlock internet access
            </p>
            
            <div className="max-w-4xl mx-auto">
              <Card className="bg-gradient-card border-0 shadow-strong">
                <CardContent className="p-8">
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                      <iframe width="100%" height="100%" src="https://www.youtube.com/embed/IxlBtQ2FvvU?si=SYKQSjS7dV0CSpje" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Market & Opportunity */}
      <section className="py-20 bg-gradient-section">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 animate-fade-in">
            <Badge className="mb-6 bg-primary/10 text-primary border-primary/20">
              📈 Market Opportunity
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Massive Growing Market
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-gradient-card border-0 shadow-medium animate-fade-in">
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-foreground mb-2">$3.39B</h3>
                <p className="text-muted-foreground">
                  Global parental control market by 2032 (CAGR 11.6%)
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-0 shadow-medium animate-fade-in">
              <CardContent className="p-6 text-center">
                <Globe className="w-12 h-12 text-secondary mx-auto mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-2">Global Regulations</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>🇧🇷 Brazil: Ban on smartphones in schools.</p>
                  <p>🇪🇸 Spain: Max 2h/week of screen use in primary schools.</p>
                  <p>🇫🇷 France: Experts recommend zero screen time under 3.</p>
                  <p>🇦🇺 Australia: Social media ban for users under 16.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-0 shadow-medium animate-fade-in">
              <CardContent className="p-6 text-center">
                <Star className="w-12 h-12 text-accent mx-auto mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-2">Our Differentiator</h3>
                <p className="text-muted-foreground">
                  Wi-Fi Kids turns control into learning time
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Revenue Model */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 animate-fade-in">
            <Badge className="mb-6 bg-secondary/10 text-secondary border-secondary/20">
              💰 Revenue Model
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Multiple Revenue Streams
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-gradient-card border-0 shadow-medium animate-slide-in">
              <CardContent className="p-6">
                <Users className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-3">B2C Families</h3>
                <p className="text-muted-foreground">Monthly subscription for families seeking better parental control</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-0 shadow-medium animate-slide-in">
              <CardContent className="p-6">
                <Shield className="w-10 h-10 text-secondary mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-3">B2B Schools</h3>
                <p className="text-muted-foreground">Licensing for educational institutions and school districts</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-0 shadow-medium animate-slide-in">
              <CardContent className="p-6">
                <Brain className="w-10 h-10 text-accent mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-3">Premium Features</h3>
                <p className="text-muted-foreground">Advanced reports + AI learning personalization</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Competitors */}
      <section className="py-20 bg-gradient-section">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 animate-fade-in">
            <Badge className="mb-6 bg-accent/10 text-accent border-accent/20">
              🏆 Competitive Advantage
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Beyond Traditional Control
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-slide-in">
              <h3 className="text-2xl font-bold text-foreground">Traditional Competitors</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Badge variant="outline">Google Family Link</Badge>
                  <span className="text-muted-foreground">Only blocks or monitors</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge variant="outline">Bark</Badge>
                  <span className="text-muted-foreground">Only blocks or monitors</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge variant="outline">Qustodio</Badge>
                  <span className="text-muted-foreground">Only blocks or monitors</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge variant="outline">Norton Family</Badge>
                  <span className="text-muted-foreground">Only blocks or monitors</span>
                </div>
              </div>
            </div>

            <div className="space-y-6 animate-fade-in">
              <h3 className="text-2xl font-bold text-foreground">Wi-Fi Kids Advantage</h3>
              <Card className="bg-gradient-hero border-0 shadow-strong text-white">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Brain className="w-6 h-6" />
                      <span className="font-medium">AI Tutor Integration</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Star className="w-6 h-6" />
                      <span className="font-medium">Educational Internet Access</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="w-6 h-6" />
                      <span className="font-medium">Learning-Based Rewards</span>
                    </div>
                  </div>
                  <p className="mt-4 text-lg font-semibold">
                    Unique Value: Turn restrictions into learning opportunities
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 animate-fade-in">
            <Badge className="mb-6 bg-primary/10 text-primary border-primary/20">
              👥 Our Team
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Expert Team Behind Wi-Fi Kids
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-gradient-card border-0 shadow-medium animate-fade-in">
              <CardContent className="p-6 text-center">
                <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4">
                  <img 
                    src={teamLucas} 
                    alt="Lucas Mazzieiro - Backend & Infrastructure specialist"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Lucas Mazzieiro</h3>
                <p className="text-muted-foreground">Backend & API</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-0 shadow-medium animate-fade-in">
              <CardContent className="p-6 text-center">
                <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4">
                  <img 
                    src={teamPaulo} 
                    alt="Paulo Cesar - AI & Integrations specialist"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Paulo Cesar</h3>
                <p className="text-muted-foreground">AI & Integrations</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-0 shadow-medium animate-fade-in">
              <CardContent className="p-6 text-center">
                <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4">
                  <img 
                    src={teamVinicius} 
                    alt="Vinicius Vollrath - Product Lead & Community manager"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Vinicius Vollrath</h3>
                <p className="text-muted-foreground">Product Lead & Infrastructure</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Links */}
      <section className="py-20 bg-gradient-section">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 animate-fade-in">
            <Badge className="mb-6 bg-accent/10 text-accent border-accent/20">
              🔗 Project Links
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Explore Wi-Fi Kids
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-gradient-card border-0 shadow-medium animate-slide-in">
              <CardContent className="p-6 text-center">
                <Github className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-3">GitHub Repository</h3>
                <p className="text-muted-foreground mb-4">Explore our open-source code</p>
                <Button variant="outline" asChild>
                  <a href="https://github.com/viniciusvollrath/WiFi-Kids" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Code
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-0 shadow-medium animate-slide-in">
              <CardContent className="p-6 text-center">
                <Play className="w-12 h-12 text-secondary mx-auto mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-3">App Prototype</h3>
                <p className="text-muted-foreground mb-4">Try our working prototype</p>
                <Button variant="outline" asChild>
                  <a href="http://app.wifikids.fun" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Try Demo
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-0 shadow-medium animate-slide-in">
              <CardContent className="p-6 text-center">
                <Play className="w-12 h-12 text-accent mx-auto mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-3">Admin Prototype</h3>
                <p className="text-muted-foreground mb-4">Try our working prototype</p>
                <Button variant="outline" asChild>
                  <a href="http://admin.wifikids.fun" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Try Demo
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-hero text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="animate-fade-in">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Join us in making the internet safer and smarter for kids
            </h2>
            <p className="text-xl opacity-90 mb-12 max-w-2xl mx-auto">
              Be part of the revolution that transforms screen time into valuable learning experiences
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button 
                variant="demo" 
                size="lg"
                asChild
                className="text-lg px-8 py-4"
              >
                <a href="mailto:vinicius@wifikids.fun">
                  <Mail className="w-5 h-5 mr-2" />
                  Get in Touch
                </a>
              </Button>
              <Button 
                variant="demo" 
                size="lg"
                asChild
                className="text-lg px-8 py-4"
              >
                <a href="https://github.com/viniciusvollrath/WiFi-Kids" target="_blank" rel="noopener noreferrer">
                  <Heart className="w-5 h-5 mr-2" />
                  Support the Project
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-background border-t">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            © 2025 Wi-Fi Kids. Making the internet safer and smarter for children.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;