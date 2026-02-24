import React from 'react';

const PageHeader = ({ title, subtitle, icon: Icon, actions }) => {
    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div className="flex items-center gap-3">
                {Icon && (
                    <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 hidden sm:flex">
                        <Icon className="text-slate-700" size={24} />
                    </div>
                )}
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                        {title}
                    </h1>
                    {subtitle && <p className="text-slate-500">{subtitle}</p>}
                </div>
            </div>
            {actions && (
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    {actions}
                </div>
            )}
        </div>
    );
};

export default PageHeader;
