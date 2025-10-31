import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useEntregas } from '@/hooks/useEntregas';
import { useClientes } from '@/hooks/useClientes';
import { useEntregadores } from '@/hooks/useEntregadores';
import { Entrega } from '@/types';
import toast from 'react-hot-toast';

// --- Zod Schema ---
const entregaSchema = z.object({
  data_pedido: z.string().nonempty('Data do pedido é obrigatória'),
  previsao_entrega: z.string().nonempty('Previsão de entrega é obrigatória'),
  descricao_compra: z.string().min(3, 'Descrição é obrigatória'),
  valor: z.number().min(0.01, 'Valor deve ser maior que zero'),
  cliente_id: z.string().uuid('Selecione um cliente'),
  entregador_id: z.string().uuid('Selecione um entregador'),
  situacao_pedido: z.string().nonempty('Situação é obrigatória'),
  user_id: z.string().optional(), // Será preenchido no backend ou hook
});

type EntregaFormValues = z.infer<typeof entregaSchema>;

const FormEntrega = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const { createEntrega, updateEntrega, entregas } = useEntregas();
  const { clientes } = useClientes();
  const { entregadores } = useEntregadores();

  const form = useForm<EntregaFormValues>({
    resolver: zodResolver(entregaSchema),
    defaultValues: async () => {
      if (isEditMode) {
        return entregas.find(e => e.id === id);
      }
      return {
        data_pedido: new Date().toISOString().split('T')[0],
        situacao_pedido: 'pedido_confirmado',
      };
    }
  });

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = form;

  const onSubmit = async (values: EntregaFormValues) => {
    try {
      if (isEditMode) {
        await updateEntrega(id!, values);
      } else {
        await createEntrega(values as any);
      }
      navigate('/entregas');
    } catch (e) {}
  };

  const entregadoresDisponiveis = entregadores.filter(e => e.cnh_situacao === 'no_prazo');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => navigate('/entregas')} className="flex items-center gap-2 text-slate-600 hover:text-purple-600 transition"><ArrowLeft size={20} /> Voltar</button>
        <h1 className="text-3xl font-bold text-slate-800">{isEditMode ? 'Editar Entrega' : 'Nova Entrega'}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Seção 1: Informações do Pedido */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-lg">
          <h2 class="text-xl font-bold text-slate-800 mb-4">Informações do Pedido</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div><label>Data do Pedido*</label><input type="date" {...register('data_pedido')} className="w-full mt-2 input"/>{errors.data_pedido && <p className='form-error'>{errors.data_pedido.message}</p>}</div>
            <div><label>Previsão de Entrega*</label><input type="date" {...register('previsao_entrega')} className="w-full mt-2 input"/>{errors.previsao_entrega && <p className='form-error'>{errors.previsao_entrega.message}</p>}</div>
            <div className="md:col-span-2"><label>Descrição*</label><textarea {...register('descricao_compra')} className="w-full mt-2 input"/>{errors.descricao_compra && <p className='form-error'>{errors.descricao_compra.message}</p>}</div>
            <div><label>Valor do Pedido*</label><input type="number" step="0.01" {...register('valor', { valueAsNumber: true })} className="w-full mt-2 input"/>{errors.valor && <p className='form-error'>{errors.valor.message}</p>}</div>
          </div>
        </div>

        {/* Seção 2: Cliente */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-lg">
          <h2 class="text-xl font-bold text-slate-800 mb-4">Cliente</h2>
          <Controller
            name="cliente_id"
            control={control}
            render={({ field }) => (
              <select {...field} className="w-full input">
                <option value="">Selecione um cliente</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            )}
          />
          {errors.cliente_id && <p className='form-error'>{errors.cliente_id.message}</p>}
        </div>

        {/* Seção 3: Entrega e Logística */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-lg">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Entrega e Logística</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label>Situação do Pedido*</label>
              <Controller name="situacao_pedido" control={control} render={({ field }) => (
                  <select {...field} className="w-full mt-2 input">
                      <option value="pedido_confirmado">Pedido Confirmado</option>
                      <option value="pronto_envio">Pronto para Envio</option>
                      <option value="enviado">Enviado</option>
                      {/* Outros status */}
                  </select>
              )}/>
              {errors.situacao_pedido && <p className='form-error'>{errors.situacao_pedido.message}</p>}
            </div>
            <div>
              <label>Entregador Responsável*</label>
              <Controller name="entregador_id" control={control} render={({ field }) => (
                  <select {...field} className="w-full mt-2 input">
                      <option value="">Selecione um entregador</option>
                      {entregadoresDisponiveis.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
                  </select>
              )}/>
              {errors.entregador_id && <p className='form-error'>{errors.entregador_id.message}</p>}
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-8">
          <button type="submit" disabled={isSubmitting} className="btn-primary bg-green-600">
            {isSubmitting ? 'Salvando...' : (isEditMode ? 'Salvar Alterações' : 'Salvar Entrega')}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default FormEntrega;