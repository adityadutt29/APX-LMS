"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from 'next/navigation';
import { 
  Globe, 
  BookOpen, 
  Users, 
  Award, 
  Star, 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin,
  ArrowRight,
  CheckCircle,
  Sparkles,
  TrendingUp,
  Shield,
  Zap,
  Play,
  Download,
  MessageCircle
} from "lucide-react";
import { useState, useEffect } from "react";

const images = [
  "/girl.jpg",
  "/student.jpg",
  "/answer.jpg",
];

const stats = [
  { value: 50000, label: "Active Learners", icon: Users },
  { value: 500, label: "Expert Instructors", icon: Award },
  { value: 2000, label: "Courses Available", icon: BookOpen },
  { value: 98, label: "Satisfaction Rate", icon: Star },
];

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Learning",
    description: "Personalized learning paths with intelligent content recommendations",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: Users,
    title: "Interactive Community",
    description: "Connect with peers and experts in real-time collaboration spaces",
    color: "from-purple-500 to-pink-500"
  },
  {
    icon: TrendingUp,
    title: "Progress Analytics",
    description: "Track your learning journey with detailed insights and reports",
    color: "from-green-500 to-emerald-500"
  },
  {
    icon: Shield,
    title: "Secure Platform",
    description: "Enterprise-grade security protecting your data and progress",
    color: "from-orange-500 to-red-500"
  }
];

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Learning Director",
    company: "Tech Corp",
    quote: "APXLMS has revolutionized our employee training program with its intuitive interface and powerful analytics.",
    avatar: "/girl.jpg"
  },
  {
    name: "Michael Chen",
    role: "University Professor",
    company: "State University",
    quote: "The platform's collaborative features have significantly enhanced our remote learning experience.",
    avatar: "/student.jpg"
  },
  {
    name: "Emma Wilson",
    role: "Lead Educator",
    company: "EduTech Solutions",
    quote: "Never seen such a perfect blend of flexibility and structure in an LMS before.",
    avatar: "/answer.jpg"
  },
];

const benefits = [
  "Unlimited course access",
  "24/7 expert support",
  "Mobile learning app",
  "Certification programs",
  "Progress tracking",
  "Community forums"
];

export default function Home() {
  const router = useRouter();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Navigation */}
      <nav className="bg-white/98 backdrop-blur-sm px-6 md:px-12 fixed w-full z-50 border-b border-gray-100 shadow-sm">
        <div className="flex justify-between items-center max-w-7xl mx-auto min-h-[60px]">
          
          {/* Left Section (Logo Only) */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center flex-shrink-0"
          >
            <div className="w-auto h-auto">
              <Image
                src="/APXLMSBlack.png"
                alt="APXLMS Logo"
                width={180}
                height={60}
                className="object-contain h-14 w-auto max-w-none"
                priority
                style={{ width: '100px', height: '70px' }}
              />
            </div>
          </motion.div>

          {/* Center Section (Nav Links) */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium text-sm">Features</a>
            <a href="#pricing" className="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium text-sm">Plans</a>
            <a href="#testimonials" className="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium text-sm">Testimonials</a>
            <a href="#contact" className="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium text-sm">Support</a>
          </div>

          {/* Right Section (Auth Buttons) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-3"
          >
            
            <Button 
              onClick={() => router.push('/auth')}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-5 py-2 text-sm font-medium rounded-full shadow-sm transition-all duration-300 transform hover:scale-105"
            >
              Get Started
            </Button>
          </motion.div>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden absolute right-6 top-1/2 transform -translate-y-1/2">
          <button className="p-2 text-gray-600 hover:text-blue-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </nav>


      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-100 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-100 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-full text-blue-600 text-sm font-medium"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI-Powered Learning Platform
                </motion.div>
                
                <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Transform Your
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block">
                    Learning Journey
                  </span>
                </h1>
                
                <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                  Experience the future of education with our comprehensive learning management system powered by AI-driven insights and interactive content.
                </p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Button 
                  onClick={() => router.push('/auth')}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 text-lg rounded-full shadow-lg transition-all duration-300 transform hover:scale-105"
                >
                  Start Learning Today
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex items-center space-x-8 pt-8"
              >
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 border-2 border-white"></div>
                  ))}
                </div>
                <div>
                  <p className="text-sm text-gray-600">Join 50,000+ learners</p>
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                    <span className="text-sm text-gray-600 ml-2">4.9/5 rating</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Content - Fixed Image Carousel */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative w-full h-[500px] rounded-3xl overflow-hidden shadow-2xl">
                <motion.div
                  className="flex h-full"
                  style={{ width: `${images.length * 100}%` }}
                  animate={{
                    x: ["0%", "-33.333%", "-66.666%", "0%"],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 12,
                    ease: "easeInOut",
                  }}
                >
                  {images.map((src, index) => (
                    <div key={index} className="w-1/3 h-full flex-shrink-0">
                      <Image
                        src={src}
                        alt={`Learning platform ${index + 1}`}
                        width={600}
                        height={500}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </motion.div>
              </div>
              
              {/* Floating Cards */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1, duration: 0.6 }}
                className="absolute -top-6 -right-6 bg-white rounded-xl shadow-lg p-4 border"
              >
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium">Course Completed</span>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2, duration: 0.6 }}
                className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-lg p-4 border"
              >
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-medium">Progress: 87%</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-8 h-8 text-blue-600" />
                </div>
                <StatItem value={stat.value} label={stat.label} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section with Fixed Left-Right Layout */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose APXLMS?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover the powerful features that make learning engaging, effective, and enjoyable
            </p>
          </motion.div>

          <div className="space-y-32">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="grid lg:grid-cols-2 gap-16 items-center"
              >
                {/* Content Section */}
                <div className={`space-y-6 ${index % 2 === 1 ? 'lg:order-2' : 'lg:order-1'}`}>
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900">{feature.title}</h3>
                  <p className="text-lg text-gray-600 leading-relaxed">{feature.description}</p>
                  
                  {/* Feature Benefits */}
                  <div className="space-y-3">
                    {[
                      "Real-time collaboration tools",
                      "Advanced analytics dashboard", 
                      "Mobile-responsive design",
                      "24/7 technical support"
                    ].slice(0, 3).map((benefit, idx) => (
                      <div key={idx} className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{benefit}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Button variant="outline" className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full mt-6">
                    Learn More
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
                
                {/* Visual Section */}
                <div className={`${index % 2 === 1 ? 'lg:order-1' : 'lg:order-2'}`}>
                  <div className="bg-white rounded-2xl shadow-2xl p-8 border relative">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 bg-gradient-to-br ${feature.color} rounded-lg flex items-center justify-center`}>
                          <feature.icon className="w-4 h-4 text-white" />
                        </div>
                        <h4 className="font-semibold text-gray-900">{feature.title}</h4>
                      </div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    
                    {/* Content Area */}
                    <div className="space-y-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mt-6">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Progress</span>
                        <span>87%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className={`bg-gradient-to-r ${feature.color} h-2 rounded-full`} style={{ width: '87%' }}></div>
                      </div>
                    </div>
                    
                    {/* Bottom Section */}
                    <div className="flex justify-between items-center pt-6 mt-6 border-t border-gray-100">
                      <div className="flex space-x-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <Star className="w-4 h-4 text-purple-600" />
                        </div>
                      </div>
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section with Enhanced Left-Right Layout */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-6">
                  Everything You Need to
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block">
                    Succeed in Learning
                  </span>
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Our comprehensive platform provides all the tools and resources you need for an exceptional learning experience.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700 font-medium">{benefit}</span>
                  </motion.div>
                ))}
              </div>

              <div className="space-y-4">
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 text-lg rounded-full shadow-lg">
                  Start Your Journey
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>14-day free trial</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>No credit card required</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8">
                <div className="bg-white rounded-2xl shadow-xl p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Learning Dashboard</h3>
                    <Zap className="w-6 h-6 text-yellow-500" />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Course Progress</span>
                      <span className="text-green-600 font-semibold">87%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-gradient-to-r from-green-400 to-green-500 h-3 rounded-full w-[87%]"></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-blue-600">12</div>
                      <div className="text-xs text-gray-600">Completed</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-purple-600">3</div>
                      <div className="text-xs text-gray-600">In Progress</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-green-600">5</div>
                      <div className="text-xs text-gray-600">Certificates</div>
                    </div>
                  </div>

                  {/* Additional Content */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Recent Activity</span>
                      <span className="text-blue-600 font-medium">View All</span>
                    </div>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">Completed: React Basics</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">Started: Advanced JavaScript</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Enhanced Floating notification */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.5, duration: 0.6 }}
                className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 border"
              >
                <div className="flex items-center space-x-2">
                  <MessageCircle className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-medium">New message from instructor</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What Our Users Say</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of satisfied learners and educators who have transformed their learning experience
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8"
          >
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="bg-white rounded-2xl shadow-xl p-8 border hover:shadow-2xl transition-all duration-300"
              >
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                    <Image
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                    <p className="text-xs text-gray-500">{testimonial.company}</p>
                  </div>
                </div>
                
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                
                <p className="text-gray-700 italic leading-relaxed">"{testimonial.quote}"</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-500 to-purple-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full"></div>
          <div className="absolute bottom-10 right-10 w-24 h-24 bg-white rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-white rounded-full"></div>
        </div>
        
        <div className="max-w-4xl mx-auto text-center px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Transform Your Learning?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of learners and educators who are already experiencing the future of education with APXLMS.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => router.push('/auth')}
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg rounded-full shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>

            <div className="pt-8 text-blue-100">
              <p className="text-sm">✨ No credit card required • 14-day free trial • Cancel anytime</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-white border-t border-gray-200 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Globe className="h-6 w-6 text-white" />
                
              <Image
                src="/APXLMSBlack.png"
                alt="APXLMS Logo"
                width={180}
                height={60}
                className="object-contain h-auto w-auto max-w-none"
                priority
                style={{ width: 'auto', height: '100px' }}
              />
              </div>
              <p className="text-gray-600">
                Empowering learners through innovative education technology and personalized learning experiences.
              </p>
              <div className="flex space-x-4">
                {[Facebook, Twitter, Instagram, Linkedin].map((Icon, index) => (
                  <a key={index} href="#" className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-blue-50 transition-colors">
                    <Icon className="w-5 h-5 text-gray-600 hover:text-pink-600" />
                  </a>
                ))}
              </div>
            </div>

            {['Product', 'Company', 'Resources'].map((title, colIndex) => (
              <div key={title}>
                <h4 className="font-semibold text-gray-900 mb-4">{title}</h4>
                <ul className="space-y-3">
                  {['Features', 'Pricing', 'Security', 'API'].map((item, index) => (
                    <li key={index}>
                      <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 pt-8 text-center">
            <p className="text-gray-600">
              © 2025 APXLms. All rights reserved. Built with ❤️ for learners worldwide.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StatItem({ value, label }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const target = typeof value === 'number' ? value : parseInt(value);
    const duration = 2000;
    const steps = 50;
    const increment = target / steps;
    const stepDuration = duration / steps;

    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <div>
      <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        {count.toLocaleString()}{typeof value === 'number' && value < 100 ? '%' : '+'}
      </div>
      <div className="text-gray-600 font-medium">{label}</div>
    </div>
  );
}