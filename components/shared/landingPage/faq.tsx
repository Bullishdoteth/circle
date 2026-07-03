"use client"

import * as React from 'react';

export default function FAQs() {
    const [openIndex, setOpenIndex] = React.useState<number | null>(null);

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    }

    const faqs = [
        {
            question: "Who is Circle built for?",
            answer:
            "Circle is designed for every community that manages money together—from savings groups and cooperatives to families, alumni associations, religious communities, investment clubs, and event organizers. If your group collects and distributes funds, Circle helps you do it with transparency and confidence.",
        },
        {
            question: "Do members need a Circle account to contribute?",
            answer:
            "No. Organizers can onboard members and assign dedicated contribution accounts even before they create a Circle account. Members can join later to access their contribution history, notifications, and group activity.",
        },
        {
            question: "How are contributions tracked?",
            answer:
            "Every contribution is automatically reconciled and linked to the correct member. Organizers can see who has paid, pending contributions, payment history, and the overall health of each circle in real time.",
        },
        {
            question: "Can I manage multiple savings circles?",
            answer:
            "Yes. Whether you're managing family savings, investment clubs, community dues, or multiple cooperatives, Circle lets you organize each group independently from a single dashboard.",
        },
        {
            question: "What happens if someone underpays or overpays?",
            answer:
            "Circle automatically flags underpayments and overpayments, making it easy to reconcile contributions without relying on spreadsheets or manual calculations.",
        },
        {
            question: "How secure is my community's money?",
            answer:
            "Security and transparency are at the core of Circle. Every payment is recorded, every transaction is traceable, and sensitive data is protected using modern security practices. Our payment infrastructure is powered by trusted financial partners.",
        },
        {
            question: "Can I schedule payouts?",
            answer:
            "Yes. Organizers can plan and manage payouts based on their group's contribution rules, ensuring funds are distributed to the right members at the right time.",
        },
        {
            question: "Is Circle available outside Nigeria?",
            answer:
            "Circle is currently focused on supporting Nigerian communities. We're building with expansion in mind and plan to support more African markets as we grow.",
        },
    ];

    return (
        <>  
            <section className='w-full flex flex-col items-center justify-center py-16 px-4'>
                <div className='w-full max-w-5xl'>
                    <div className='mb-10'>
                        <h2 className='font-space-grotesk text-3xl tracking-tight text-neutral-900'>Everything you need to know.
                        </h2>
                        <p className="mt-4 max-w-2xl text-lg leading-8 text-neutral-600">Learn how Circle helps communities collect contributions, manage shared funds, and build trust through transparent financial collaboration.
                        </p>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4'>
                        {faqs.map((faq, index) => (
                            <div key={index} onClick={() => toggleFAQ(index)} className={`bg-slate-50 p-3.5 rounded-lg cursor-pointer transition-all duration-300 border border-slate-200 hover:bg-slate-100 ${openIndex === index ? 'row-span-2' : ''}`}>
                                <div className='flex items-center justify-between'>
                                    <span className='text-sm font-medium text-neutral-800'>{faq.question}</span>
                                    <div className={`text-slate-400 p-1 rounded transition-colors ${openIndex === index ? 'bg-slate-200 text-slate-500' : 'hover:bg-slate-300 hover:text-slate-500'}`}>
                                        {openIndex === index ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-minus"><path d="M5 12h14"/></svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                                        )}
                                    </div>
                                </div>
                                <div className={`grid transition-all duration-300 ease-in-out ${openIndex === index ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0'}`}>
                                    <div className='overflow-hidden'>
                                        <p className='text-sm text-neutral-600 leading-relaxed'>
                                            {faq.answer}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </>
    )
}